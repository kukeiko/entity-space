import {
    copyEntities,
    Entity,
    EntityQuery,
    EntitySchema,
    entityToId,
    isHydrated,
    matchesCriterion,
    mergeEntities,
} from "@entity-space/elements";
import { isDefined } from "@entity-space/utils";
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

    upsert(query: EntityQuery, entities: Entity[]): void {
        for (const entity of entities) {
            const slot = this.#idIndex.get(entity);

            if (slot === undefined) {
                this.#idIndex.set(entity, this.#entities.length);
                this.#entities.push(entity);
            } else {
                const previous = this.#entities[slot]!;
                this.#entities[slot] = mergeEntities([previous, entity]);
            }
        }

        const parameters = query.getParameters();

        if (parameters !== undefined) {
            this.#parametersCache.set(
                parameters,
                entities.map(entity => entityToId(this.#schema, entity)),
            );
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

    clear(): void {
        this.#entities = [];
        this.#idIndex.clear();
    }
}
