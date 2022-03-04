import { Observable, Subject } from "rxjs";
import { mergeQueries, Query, reduceQueries } from "../query/public";
import { IEntitySchema } from "../schema/schema.interface";
import { Entity } from "./entity";
import { EntityCache } from "./entity-cache";
import { IEntitySource } from "./entity-source.interface";
import { QueriedEntities } from "./queried-entities";

export class Workspace implements IEntitySource {
    private source?: IEntitySource;
    private readonly queryCaches = new Map<string, Query[]>();
    private readonly queryCacheChanged = new Subject<Query[]>();
    private readonly entityCache = new EntityCache();

    onQueryCacheChanged(): Observable<Query[]> {
        return this.queryCacheChanged.asObservable();
    }

    add(schema: IEntitySchema, entities: Entity[]): void {
        this.entityCache.addEntities(schema, entities);
    }

    setSource(source: IEntitySource): void {
        this.source = source;
    }

    private addExecutedQuery(query: Query): void {
        const executedQueries = this.getOrCreateQueryCache(query.getEntitySchema());
        let merged = mergeQueries(query, ...executedQueries);
        this.queryCaches.set(query.getEntitySchema().getId(), merged);

        const allQueriesInCache: Query[] = [];

        for (const [_, queries] of this.queryCaches) {
            allQueriesInCache.push(...queries);
        }

        this.queryCacheChanged.next(allQueriesInCache);
    }

    private async loadUncachedIntoCache(query: Query): Promise<void> {
        const executedQueries = this.getOrCreateQueryCache(query.getEntitySchema());
        const reduced = reduceQueries([query], executedQueries);
        const entities: Entity[] = [];
        const queriesAgainstSource = reduced === false ? [query] : reduced;

        for (const queryAgainstSource of queriesAgainstSource) {
            const result = await this.loadFromSource(queryAgainstSource);

            if (result === false) {
                continue;
            }

            for (const queried of result) {
                entities.push(...queried.getEntities());
            }

            // [todo] should it not be queryAgainstSource?
            // if not, move out of loop
            this.addExecutedQuery(query);
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

    clear(): void {
        this.queryCaches.clear();
        this.entityCache.clear();
        this.queryCacheChanged.next([]);
    }

    private getOrCreateQueryCache(schema: IEntitySchema): Query[] {
        let cache = this.queryCaches.get(schema.getId());

        if (cache === void 0) {
            cache = [];
            this.queryCaches.set(schema.getId(), cache);
        }

        return cache;
    }
}
