import {
    criterionToWhereEntityShapeInstance,
    Entity,
    EntityQuery,
    EntityQueryShape,
    mergeQueries,
    PackedEntitySelection,
    reshapeQuery,
    reshapeQueryShape,
    validateEntity,
    WhereEntityShape,
    WhereEntityShapeInstance,
} from "@entity-space/elements";
import { isNot } from "@entity-space/utils";
import { partition } from "lodash";
import { isObservable, lastValueFrom, Observable } from "rxjs";
import { EntityQueryExecutionContext } from "../entity-query-execution-context";
import { EntityQueryTracing } from "../entity-query-tracing";
import { AcceptedEntitySourcing } from "./accepted-entity-sourcing";

export type LoadedEntities<T extends Entity = Entity> =
    | T
    | T[]
    | Promise<T>
    | Promise<T[]>
    | Observable<T>
    | Observable<T[]>;

export type LoadEntitiesFunction<T extends Entity = Entity, C = {}, P extends Entity = Entity> = (args: {
    query: EntityQuery;
    selection: PackedEntitySelection<T>; // [todo] replace with TypedEntitySelection<T>
    criteria: C;
    parameters: P;
}) => LoadedEntities<T>;

export class EntitySource {
    constructor(
        tracing: EntityQueryTracing,
        queryShape: EntityQueryShape,
        load: LoadEntitiesFunction,
        whereEntityShape?: WhereEntityShape,
    ) {
        this.#tracing = tracing;
        this.#queryShape = queryShape;
        this.#load = load;
        this.#whereEntityShape = whereEntityShape;
    }

    readonly #tracing: EntityQueryTracing;
    readonly #queryShape: EntityQueryShape;
    readonly #load: LoadEntitiesFunction;
    readonly #whereEntityShape?: WhereEntityShape;

    accept(queryShape: EntityQueryShape): AcceptedEntitySourcing | false {
        const reshaped = reshapeQueryShape(queryShape, this.#queryShape);

        if (reshaped === false) {
            return false;
        }

        return new AcceptedEntitySourcing(this, reshaped, (query, context) => this.#executeQuery(query, context));
    }

    async #executeQuery(query: EntityQuery, context: EntityQueryExecutionContext): Promise<Entity[]> {
        const reshaped = reshapeQuery(this.#queryShape, query);

        if (!reshaped) {
            throw new Error(`failed to reshape query ${query.toString()} using ${this.#queryShape.toString()}`);
        }

        if (!context.readFromCache() && !context.loadFromSource()) {
            return [];
        }

        if (!context.readFromCache()) {
            const entities = await Promise.all(reshaped.map(reshapedQuery => this.#loadQuery(reshapedQuery, query)));
            return entities.flat();
        }

        const uncached = reshaped.flatMap(query => this.#subtractByCache(query, context));

        if (!uncached.length) {
            reshaped.forEach(query => this.#tracing.queryWasLoadedFromCache(query));
        }

        if (uncached.length && context.loadFromSource()) {
            await Promise.all(
                uncached.map(async uncachedQuery => {
                    const entities = await this.#loadQuery(uncachedQuery, query);
                    context.getCache().upsert(uncachedQuery, entities);
                    return entities;
                }),
            );
        }

        return reshaped.flatMap(query => context.getCache().query(query));
    }

    async #loadQuery(query: EntityQuery, originalQuery: EntityQuery): Promise<Entity[]> {
        const criterion = query.getCriterion();
        let criteria: WhereEntityShapeInstance = {};

        if (this.#whereEntityShape && criterion) {
            criteria = criterionToWhereEntityShapeInstance(this.#whereEntityShape, criterion);
        }

        this.#tracing.queryDispatchedToSource(query, originalQuery, this.#queryShape.getCriterionShape());
        const loaded = this.#load({
            query,
            selection: query.getSelection(),
            criteria,
            parameters: query.getParameters()?.getValue() ?? {},
        });
        const entities = await this.#loadedToEntities(loaded);
        this.#tracing.queryReceivedEntities(query, entities);

        const [validEntities, invalidEntities] = partition(
            entities,
            entity => validateEntity(this.#queryShape.getSchema(), entity) === undefined,
        );

        if (invalidEntities.length) {
            this.#tracing.filteredInvalidEntities(query, invalidEntities);
        }

        return validEntities;
    }

    async #loadedToEntities(loaded: LoadedEntities): Promise<Entity[]> {
        let entities: Entity | Entity[];

        if (loaded instanceof Promise) {
            entities = await loaded;
        } else if (isObservable(loaded)) {
            entities = await lastValueFrom(loaded as Observable<Entity | Entity[]>);
        } else {
            entities = loaded;
        }

        return Array.isArray(entities) ? entities : [entities];
    }

    #subtractByCache(query: EntityQuery, context: EntityQueryExecutionContext): EntityQuery[] {
        const openQueries = context.getCache().subtractByCache(query);

        if (openQueries === true) {
            return [];
        } else if (openQueries === false) {
            return [query];
        }

        const openMerged = mergeQueries(openQueries) || openQueries;
        const openReshaped = openMerged.map(openQuery => reshapeQuery(this.#queryShape, openQuery));

        if (!openReshaped.every(isNot(false))) {
            return [query];
        }

        return openReshaped.flat();
    }
}
