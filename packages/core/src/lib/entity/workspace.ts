import { any } from "@entity-space/criteria";
import { flatMap } from "lodash";
import { from, Observable, of, startWith, Subject, switchMap } from "rxjs";
import { ExpansionObject } from "../public";
import { mergeQueries, Query, reduceQueries } from "../query/public";
import { IEntitySchema } from "../schema/schema.interface";
import { QueriedEntities } from "./data-structures/queried-entities";
import { Entity } from "./entity";
import { EntityCache } from "./entity-cache";
import { IEntitySource } from "./entity-source.interface";
import { createCriterionFromEntities } from "./functions/create-criterion-from-entities.fn";
import { IEntityStore } from "./i-entity-store";

export class Workspace implements IEntitySource, IEntityStore {
    private source?: IEntitySource;
    private store?: IEntityStore;
    private readonly queryCaches = new Map<string, Query[]>();
    private readonly queryCacheChanged = new Subject<Query[]>();
    // private readonly entityCache = new EntityCache();
    private readonly entityCache = new EntityCache();
    private readonly watchedQueries = new Map<Query, Subject<Entity[]>>();

    onQueryCacheChanged(): Observable<Query[]> {
        return this.queryCacheChanged.asObservable();
    }

    add<T extends Entity = Entity>(schema: IEntitySchema, entities: T[]): void {
        const queries = this.entityCache.addEntities(schema, entities);

        for (const query of queries) {
            this.addExecutedQuery(query);
        }

        for (const [watchedQuery, subject] of this.watchedQueries) {
            if (
                watchedQuery.getEntitySchema().getId() === schema.getId() &&
                watchedQuery.getCriteria().filter(entities).length > 0
            ) {
                this.query(watchedQuery).then(value => {
                    if (value === false) return;
                    subject.next(flatMap(value, x => x.getEntities()));
                });
            }
        }
    }

    setSource(source: IEntitySource): void {
        this.source = source;
    }

    setStore(store: IEntityStore): void {
        this.store = store;
    }

    private addExecutedQuery(query: Query): void {
        const executedQueries = this.getCachedQueries(query.getEntitySchema());
        const merged = mergeQueries(query, ...executedQueries);
        this.queryCaches.set(query.getEntitySchema().getId(), merged);

        const allQueriesInCache: Query[] = [];

        for (const [_, queries] of this.queryCaches) {
            allQueriesInCache.push(...queries);
        }

        this.queryCacheChanged.next(allQueriesInCache);
    }

    private async loadUncachedIntoCache(query: Query): Promise<void> {
        const cachedQueries = this.getCachedQueries(query.getEntitySchema());
        const reduced = reduceQueries([query], cachedQueries);
        const entities: Entity[] = [];
        const queriesAgainstSource = reduced === false ? [query] : reduced;

        // [todo] call in parallel
        for (const queryAgainstSource of queriesAgainstSource) {
            const result = await this.loadFromSource(queryAgainstSource);

            if (result === false) {
                console.warn("encountered a query that could not be executed against source", queriesAgainstSource);
                continue;
            }

            for (const queried of result) {
                entities.push(...queried.getEntities());
            }

            // [todo] should it not be queryAgainstSource?
            // if not, move out of loop
            // [todo] actually, maybe it should be result[i].getQuery()?
            // this.addExecutedQuery(query);
            // [todo] for now i decided caching queryAgainstSource, as that fixes the issue in products example
            // where you execute criteria = any, expansion = reviews, and since the controller endpoint doesn't
            // support any expansion, we don't get reviews back, but we cache it as if we had, so a subsequent
            // call using e.g. minRating = 3 won't have reviews included
            this.addExecutedQuery(queryAgainstSource);
        }

        if (entities.length > 0) {
            this.add(query.getEntitySchema(), entities);
        }
    }

    private async loadFromSource(query: Query): Promise<false | QueriedEntities[]> {
        if (this.source === void 0) {
            return false;
        }

        const result = await this.source.query(query);

        if (result !== false) {
            for (const queried of result) {
                console.log("[effective-query]", queried.getQuery().getCriteria().toString());
            }
        }

        return result;
    }

    async query(query: Query): Promise<false | QueriedEntities[]> {
        await this.loadUncachedIntoCache(query);
        const entities = await this.queryAgainstCache(query);

        return [new QueriedEntities(query, entities)];
    }

    query$<T extends Entity>(query: Query): Observable<T[]> {
        const subject = new Subject<Entity[]>();

        return from(this.query(query)).pipe(
            switchMap(result => {
                if (result === false) {
                    return of([]);
                }

                const keySchema = query.getEntitySchema().getKey();
                const entities = flatMap(result, x => x.getEntities());
                // [todo] also track related entities
                const trackedCriterion = createCriterionFromEntities(entities, keySchema.getPath());
                this.watchedQueries.set(
                    new Query(query.getEntitySchema(), trackedCriterion, query.getExpansionObject()),
                    subject
                );

                return subject.asObservable().pipe(startWith(entities)) as any as Observable<T[]>;
            })
        );
    }

    query$_v2<T extends Entity>(
        schema: IEntitySchema,
        criterion = any(),
        expansion: ExpansionObject<T> = {}
    ): Observable<T[]> {
        return this.query$(new Query(schema, criterion, expansion));
    }

    // [todo] remove any
    // [todo] should stay async because at one point i want to make use of service-workers
    // [todo] should not exist at all? (or be private)
    async queryAgainstCache(query: Query): Promise<Entity[]> {
        const result = await this.entityCache.query(query);

        if (result === false) {
            return [];
        }

        return result.map(queried => queried.getEntities()).reduce((acc, value) => [...acc, ...value], []);
    }

    async create(entities: Entity[], schema: IEntitySchema): Promise<false | Entity[]> {
        const result = (await this.store?.create(entities, schema)) ?? false;

        if (result === false) {
            return false;
        }

        this.add(schema, entities);

        return entities;
    }

    async update(entities: Entity[], schema: IEntitySchema): Promise<false | Entity[]> {
        const result = (await this.store?.update(entities, schema)) ?? false;

        if (result === false) {
            return false;
        }

        this.add(schema, entities);

        return entities;
    }

    delete(entities: Entity[], schema: IEntitySchema): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

    clear(): void {
        this.queryCaches.clear();
        this.entityCache.clear();
        this.queryCacheChanged.next([]);
    }

    private getCachedQueries(schema: IEntitySchema): Query[] {
        let cache = this.queryCaches.get(schema.getId());

        if (cache === void 0) {
            cache = [];
            this.queryCaches.set(schema.getId(), cache);
        }

        return cache;
    }
}
