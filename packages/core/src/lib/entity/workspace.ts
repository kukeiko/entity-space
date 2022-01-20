import { Observable, Subject } from "rxjs";
import { mergeQueries, Query, reduceQueries } from "../query/public";
import { IEntitySchema } from "../schema/schema.interface";
import { Entity } from "./entity";
import { EntityCache } from "./entity-cache";
import { IEntitySource } from "./entity-source.interface";
import { QueriedEntities } from "./queried-entities";

// [todo] should implement IEntitySource
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
        const executedQueries = this.getOrCreateQueryCache(query.entitySchema);
        let merged = mergeQueries(query, ...executedQueries);
        this.queryCaches.set(query.entitySchema.getId(), merged);

        const allQueriesInCache: Query[] = [];

        for (const [_, queries] of this.queryCaches) {
            allQueriesInCache.push(...queries);
        }

        this.queryCacheChanged.next(allQueriesInCache);
    }

    private async loadUncachedIntoCache(query: Query): Promise<void> {
        const executedQueries = this.getOrCreateQueryCache(query.entitySchema);
        const reduced = reduceQueries([query], executedQueries);
        const entities: Entity[] = [];
        const queriesAgainstSource = reduced === false ? [query] : reduced;

        for (const queryAgainstSource of queriesAgainstSource) {
            const result = await this.loadFromSource(queryAgainstSource);

            if (result === false) {
                continue;
            }

            entities.push(...result.getEntities());
            this.addExecutedQuery(query);
        }

        if (entities.length > 0) {
            this.add(query.entitySchema, entities);
        }
    }

    private async loadFromSource(query: Query): Promise<false | QueriedEntities> {
        if (this.source === void 0) {
            return false;
        }

        const result = await this.source.query(query);

        if (result !== false) {
            console.log("[effective-query]", result.getQuery().criteria.toString());
        }

        return result;
    }

    async query(query: Query): Promise<false | QueriedEntities> {
        await this.loadUncachedIntoCache(query);
        const entities = await this.queryAgainstCache(query);

        return new QueriedEntities(query, entities);
    }

    // [todo] remove any
    // [todo] should stay async because at one point i want to make use of service-workers
    // [todo] should not exist at all? (or be private)
    async queryAgainstCache(query: Query): Promise<any[]> {
        const result = await this.entityCache.query(query);

        if (result === false) {
            return [];
        }

        return result.getEntities();
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
