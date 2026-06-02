import {
    criterionToWhereEntityShapeInstance,
    Entity,
    EntityBlueprint,
    EntityPage,
    EntityQuery,
    EntityQueryShape,
    EntitySort,
    mergeQueries,
    reshapeQuery,
    reshapeQueryShape,
    reshapeSelection,
    slicePage,
    sortEntities,
    sortRelatedEntities,
    toRelationSelection,
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

export interface LoadEntitiesSort {
    key: string;
    ascending: boolean;
}

export interface LoadEntitiesPage {
    index: number;
    size: number;
    from: number;
    to: number;
    top: number;
    skip: number;
}

export type LoadEntitiesFn<B = {}, W = {}, S = {}, P = {}> = (args: {
    query: EntityQuery;
    selection: DeepPartial<S>;
    criteria: WhereEntityShapeInstance<W, EntityBlueprint.Type<B>>;
    parameters: EntityBlueprint.Type<P>;
    sort?: LoadEntitiesSort[];
    page?: LoadEntitiesPage;
}) => MaybeAsync<EntityBlueprint.Type<B>> | MaybeAsync<EntityBlueprint.Type<B>[]>;

function toLoadEntitiesSort(sort?: EntitySort): LoadEntitiesSort[] | undefined {
    if (sort === undefined) {
        return undefined;
    }

    return sort
        .getProperties()
        .map(
            property =>
                ({ key: property.getPath().toString(), ascending: property.isAscending() }) satisfies LoadEntitiesSort,
        );
}

function toLoadEntitiesPage(page?: EntityPage): LoadEntitiesPage | undefined {
    if (page === undefined) {
        return undefined;
    }

    const [to, top] = [page.getTo(), page.getTop()];

    if (to === undefined || top === undefined) {
        return undefined;
    }

    const skip = page.getSkip();

    return {
        index: -1, // [todo] ❌ somehow support this
        size: -1, // [todo] ❌ somehow support this
        from: page.getFrom(),
        to,
        skip,
        top,
    };
}

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
    #pendingRequests: { query: EntityQuery; result: ReturnType<LoadEntitiesFn> }[] = [];

    accept(queryShape: EntityQueryShape): AcceptedEntitySourcing | false {
        const reshaped = reshapeQueryShape(queryShape, this.#queryShape);

        if (reshaped === false) {
            return false;
        }

        return new AcceptedEntitySourcing(this, reshaped, (query, context) => this.#executeQuery(query, context));
    }

    async #executeQuery(query: EntityQuery, context: EntityQueryExecutionContext): Promise<Entity[]> {
        const reshaped = reshapeQuery(query, this.#queryShape);

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
            await this.#loadIntoCache(uncached, query, context);
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
                const entities = await this.#loadOneFromSource(query, originalQuery, context);
                const relationSelection = toRelationSelection(query.getSchema(), query.getSelection());
                sortRelatedEntities(query.getSchema(), relationSelection, entities);

                return entities;
            }),
        );

        return entities.flat();
    }

    async #loadOneFromSource(
        query: EntityQuery,
        originalQuery: EntityQuery,
        context: EntityQueryExecutionContext,
    ): Promise<Entity[]> {
        const criterion = query.getCriterion();
        let criteria: WhereEntityShapeInstance = {};

        if (this.#whereEntityShape) {
            criteria = criterionToWhereEntityShapeInstance(this.#whereEntityShape, criterion);
        }

        this.#tracing.queryDispatchedToSource(query, originalQuery, this.#queryShape.getCriterionShape());

        const loaded = await this.#executeLoad({
            query,
            selection: reshapeSelection(this.#queryShape.getSelection(), query.getSelection()),
            criteria,
            parameters: query.getParameters()?.getValue() ?? {},
            sort: toLoadEntitiesSort(query.getSort()),
            page: toLoadEntitiesPage(query.getPage()),
        });

        const result = await unwrapMaybeAsync(loaded);
        let entities = Array.isArray(result) ? result : [result];
        this.#tracing.queryReceivedEntities(query, entities);

        if (context.writeToCache()) {
            context.getCache().upsertQuery(query, entities, context);
        }

        const sort = originalQuery.getSort();
        const page = originalQuery.getPage();

        if (sort !== undefined && this.#queryShape.getPageShape() === undefined && page !== undefined) {
            entities = sortEntities(entities, sort);
            entities = slicePage(entities, page);
        }

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
        originalQuery: EntityQuery,
        context: EntityQueryExecutionContext,
    ): Promise<void> {
        await Promise.all(queries.map(async query => this.#loadOneFromSource(query, originalQuery, context)));
    }

    #subtractByCache(queries: readonly EntityQuery[], context: EntityQueryExecutionContext): EntityQuery[] {
        return queries.flatMap(query => this.#subtractOneByCache(query, context));
    }

    #subtractOneByCache(query: EntityQuery, context: EntityQueryExecutionContext): EntityQuery[] {
        const openQueries = context.getCache().subtractByCache(query, context.getMaxTimestamp());

        if (openQueries === true) {
            return [];
        } else if (openQueries === false) {
            return [query];
        }

        const openMerged = mergeQueries(openQueries) || openQueries;
        const openReshaped = openMerged.map(openQuery => reshapeQuery(openQuery, this.#queryShape));

        if (!openReshaped.every(isNot(false))) {
            return [query];
        }

        return openReshaped.flat();
    }

    async #executeLoad(...args: Parameters<LoadEntitiesFn>): Promise<ReturnType<LoadEntitiesFn>> {
        const query = args[0].query;
        let loader = this.#pendingRequests.find(request => request.query.toString() === query.toString());

        if (loader === undefined) {
            const result = this.#load(...args);
            this.#pendingRequests.push({ query, result });
            const entities = await unwrapMaybeAsync(result);

            this.#pendingRequests = this.#pendingRequests.filter(
                request => request.query.toString() !== query.toString(),
            );

            return entities;
        } else {
            this.#tracing.querySourceCallReused(query);
            return loader.result;
        }
    }
}
