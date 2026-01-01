import {
    copyEntities,
    Entity,
    EntityQuery,
    EntityQueryParameters,
    EntitySchema,
    entityToId,
    isHydrated,
    matchesCriterion,
    mergeEntities,
} from "@entity-space/elements";
import { isDefined } from "@entity-space/utils";
import { isEqual } from "lodash";
import { Observable, Subject } from "rxjs";
import { EntityQueryExecutionContext } from "../entity-query-execution-context";
import { EntityStoreUniqueIndex } from "./entity-store-unique-index";
import { ParametersCache } from "./parameters-cache";

export class EntityStore {
    constructor(schema: EntitySchema) {
        if (!schema.hasId()) {
            throw new Error(`can't create an EntityStore for entity type ${schema.getName()} that has no id defined`);
        }

        this.#schema = schema;
        this.#idIndex = new EntityStoreUniqueIndex(schema.getIdPaths());
    }

    readonly #schema: EntitySchema;
    readonly #idIndex: EntityStoreUniqueIndex;
    readonly #parametersCache = new ParametersCache();
    readonly #changed = new Subject<EntityQueryExecutionContext | undefined>();
    #entities: (Entity | undefined)[] = [];

    getAll(): Entity[] {
        return this.#entities.filter(isDefined);
    }

    get(entity: Entity): Entity | undefined {
        const slot = this.#idIndex.get(entity);

        if (slot === undefined) {
            return undefined;
        }

        return this.#entities[slot];
    }

    query(query: EntityQuery): Entity[] {
        const criterion = query.getCriterion();
        const selection = query.getSelection();
        const parameters = query.getParameters();

        let entities: Entity[] = [];

        if (parameters === undefined) {
            entities = this.getAll();
        } else {
            const ids = this.#parametersCache.get(parameters) ?? [];
            entities = ids.map(id => this.get(id)).filter(isDefined);
        }

        if (criterion !== undefined) {
            entities = entities.filter(matchesCriterion(criterion));
        }

        if (selection !== undefined) {
            entities = entities.filter(entity => isHydrated(entity, selection));
        }

        entities = copyEntities(this.#schema, entities);

        return entities;
    }

    upsert(entities: Entity[], parameters?: EntityQueryParameters, context?: EntityQueryExecutionContext): void {
        let madeChanges = false;

        for (const entity of entities) {
            const slot = this.#idIndex.get(entity);

            if (slot === undefined) {
                this.#idIndex.set(entity, this.#entities.length);
                this.#entities.push(entity);
                madeChanges = true;
            } else {
                const previous = this.#entities[slot]!;

                if (!isEqual(previous, entity)) {
                    this.#entities[slot] = mergeEntities([previous, entity]);
                    madeChanges = true;
                }
            }
        }

        if (parameters !== undefined) {
            const previous = this.#parametersCache.get(parameters);
            const next = entities.map(entity => entityToId(this.#schema, entity));

            if (!isEqual(previous, next)) {
                this.#parametersCache.set(
                    parameters,
                    entities.map(entity => entityToId(this.#schema, entity)),
                );

                madeChanges = true;
            }
        }

        if (madeChanges) {
            this.#changed.next(context);
        }
    }

    remove(entity: Entity): void {
        const slot = this.#idIndex.get(entity);

        if (slot === undefined) {
            return;
        }

        this.#entities[slot] = undefined;
        this.#idIndex.delete(entity);
    }

    onChange(): Observable<EntityQueryExecutionContext | undefined> {
        return this.#changed.asObservable();
    }

    clear(): void {
        this.#entities = [];
        this.#idIndex.clear();
    }
}
