import {
    criterionToWhereEntityShapeInstance,
    Entity,
    EntityBlueprint,
    EntityQuery,
    EntityQueryShape,
    mergeQueries,
    reshapeQuery,
    reshapeQueryShape,
    reshapeSelection,
    validateEntity,
    WhereEntityShape,
    WhereEntityShapeInstance,
} from "@entity-space/elements";
import { DeepPartial, isNot, MaybeAsync, unwrapMaybeAsync } from "@entity-space/utils";
import { partition } from "lodash";
import { EntityQueryExecutionContext } from "../entity-query-execution-context";
import { EntityQueryTracing } from "../entity-query-tracing";
import { AcceptedEntitySourcing } from "./accepted-entity-sourcing";

export type LoadEntitiesFnResult<T extends Entity = Entity> = MaybeAsync<T> | MaybeAsync<T[]>;

export type LoadEntitiesFn<B = {}, W = {}, S = {}, P = {}> = (args: {
    query: EntityQuery;
    selection: DeepPartial<S>;
    criteria: WhereEntityShapeInstance<W, EntityBlueprint.Type<B>>;
    parameters: EntityBlueprint.Type<P>;
}) => MaybeAsync<EntityBlueprint.Type<B>> | MaybeAsync<EntityBlueprint.Type<B>[]>;

export class EntitySource {
    constructor(
        tracing: EntityQueryTracing,
        queryShape: EntityQueryShape,
        load: LoadEntitiesFn,
        whereEntityShape?: WhereEntityShape,
    ) {
        this.#tracing = tracing;
        this.#queryShape = queryShape;
        this.#load = load;
        this.#whereEntityShape = whereEntityShape;
    }

    readonly #tracing: EntityQueryTracing;
    readonly #queryShape: EntityQueryShape;
    readonly #load: LoadEntitiesFn;
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

        if (!context.readFromCache()) {
            return this.#loadFromSource(reshaped, context, query);
        }

        const uncached = this.#subtractByCache(reshaped, context);

        // [todo] ❌ should also log if there were partial cache hits
        if (!uncached.length) {
            reshaped.forEach(query => this.#tracing.queryWasLoadedFromCache(query));
        }

        if (uncached.length && context.loadFromSource() && context.writeToCache()) {
            await this.#loadIntoCache(uncached, context, query);
        }

        return this.#loadFromCache(reshaped, context);
    }

    async #loadFromSource(
        queries: readonly EntityQuery[],
        context: EntityQueryExecutionContext,
        originalQuery: EntityQuery,
    ): Promise<Entity[]> {
        const entities = await Promise.all(
            queries.map(async query => {
                const entities = await this.#loadOneFromSource(query, originalQuery);

                if (context.writeToCache()) {
                    context.getCache().upsertQuery(query, entities, context);
                }

                // [todo] ❌ sort relations

                return entities;
            }),
        );

        return entities.flat();
    }

    async #loadOneFromSource(query: EntityQuery, originalQuery: EntityQuery): Promise<Entity[]> {
        const criterion = query.getCriterion();
        let criteria: WhereEntityShapeInstance = {};

        if (this.#whereEntityShape && criterion) {
            criteria = criterionToWhereEntityShapeInstance(this.#whereEntityShape, criterion);
        }

        this.#tracing.queryDispatchedToSource(query, originalQuery, this.#queryShape.getCriterionShape());
        const loaded = this.#load({
            query,
            selection: reshapeSelection(this.#queryShape.getSelection(), query.getSelection()),
            criteria,
            parameters: query.getParameters()?.getValue() ?? {},
        });

        const result = await unwrapMaybeAsync(loaded);
        const entities = Array.isArray(result) ? result : [result];
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

    #loadFromCache(queries: readonly EntityQuery[], context: EntityQueryExecutionContext): Entity[] {
        return queries.flatMap(query => context.getCache().query(query));
    }

    async #loadIntoCache(
        queries: readonly EntityQuery[],
        context: EntityQueryExecutionContext,
        originalQuery: EntityQuery,
    ): Promise<void> {
        await Promise.all(
            queries.map(async query => {
                const entities = await this.#loadOneFromSource(query, originalQuery);
                context.getCache().upsertQuery(query, entities, context);
            }),
        );
    }

    #subtractByCache(queries: readonly EntityQuery[], context: EntityQueryExecutionContext): EntityQuery[] {
        return queries.flatMap(query => this.#subtractOneByCache(query, context));
    }

    #subtractOneByCache(query: EntityQuery, context: EntityQueryExecutionContext): EntityQuery[] {
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
