import * as _ from "lodash";
import { IEntityType, IEntity } from "../metadata";
import { Query, QueryType, QueryIdentity } from "../elements";
import { AllQueryCache } from "./all-query-cache";
import { ByIndexesQueryCache } from "./by-indexes-query-cache";
import { ByKeyQueryCache } from "./by-key-query-cache";

type PerExpansions = Map<string, QueryType<any>>;
type PerIdentity = Map<QueryIdentity, PerExpansions>;

export class QueryCache {
    get cachedQueries(): QueryType<any>[] {
        return Array.from(this._all.values());
    }

    private _all = new Set<QueryType<any>>();
    private _byType = new Map<IEntityType<any>, PerIdentity>();

    private _allQueryCaches = new Map<IEntityType<any>, AllQueryCache<any>>();
    private _byIndexesCaches = new Map<IEntityType<any>, ByIndexesQueryCache<any>>();
    private _byKeyCaches = new Map<IEntityType<any>, ByKeyQueryCache<any>>();

    reduce<T extends IEntity>(query: QueryType<T>): QueryType<T>[] {
        switch (query.type) {
            case "key":
                {
                    // todo: also consider QueryAllCache
                    let byKeyCache = this._getByKeyQueryCache<T>(query.entityType);
                    let reduced = byKeyCache.reduce(query);

                    return reduced ? [reduced] : null;
                }

            default:
                throw `reduce() for query type ${query.type} not implemented`;
        }
    }

    // todo: implementation incomplete
    add(query: QueryType<any>): void {
        if (this.isCached(query)) return;

        switch (query.type) {
            case "key":
                this._getByKeyQueryCache(query.entityType).add(query);
                break;

            case "keys":
                {
                    // todo: possibly instead overload add() @ cache to support ByKeys query
                    let cache = this._getByKeyQueryCache(query.entityType);

                    query.keys.forEach(k => {
                        cache.add(new Query.ByKey({
                            entityType: query.entityType,
                            expansions: query.expansions.slice(),
                            key: k
                        }));
                    });
                }
                break;

            case "indexes":
                this._getByIndexesQueryCache(query.entityType).add(query);
                break;

            case "all":
                this._getAllQueryCache(query.entityType).add(query);
                break;

            default:
                throw `incompatible/unknown query: ${query}`;
        }
    }

    // todo: implementation incomplete
    isCached(query: QueryType<any>): boolean {
        let allCache = this._getAllQueryCache(query.entityType);

        if (allCache.isCached(query)) return true;

        switch (query.type) {
            case "key": return this._getByKeyQueryCache(query.entityType).isCached(query);

            case "keys":
                {
                    // todo: possibly instead overload add() @ cache to support ByKeys query
                    let cache = this._getByKeyQueryCache(query.entityType);

                    return query.keys.every(k => cache.isCached(new Query.ByKey({
                        entityType: query.entityType,
                        expansions: query.expansions.slice(),
                        key: k
                    })));
                }

            case "indexes": return this._getByIndexesQueryCache(query.entityType).isCached(query);

            default: return false;
        }
    }

    /**
     * Clear parts or all of the cache.
     */
    clear(args?: {
        entityType?: IEntityType<any>;
        queryIdentity?: QueryIdentity;
    }): void {
        args = args || {};

        if (args.entityType && args.queryIdentity) {
            let cache = this._perExpansion(args.entityType, args.queryIdentity);
            cache.clear();
        } else if (args.entityType) {
            let cache = this._perIdentity(args.entityType);
            cache.clear();
        } else if (args.queryIdentity) {
            this._byType.forEach(perIdentity => {
                perIdentity.set(args.queryIdentity, new Map<string, QueryType<any>>());
            });
        } else {
            this._byType = new Map<IEntityType<any>, PerIdentity>();
        }
    }

    numCached(args?: {
        entityType?: IEntityType<any>;
        queryIdentity?: QueryIdentity;
    }): number {
        if (!args) {
            let all = _.flatten(Array.from(this._byType.values()).map(x => Array.from(x.values())));
            return _.flatten(all.map(x => Array.from(x.values()))).length;
        } else if (args.entityType && args.queryIdentity) {
            return this._perExpansion(args.entityType, args.queryIdentity).size;
        } else if (args.entityType) {
            let allIdentities = Array.from(this._perIdentity(args.entityType).values());
            return _.flatten(allIdentities.map(x => Array.from(x.values()))).length;
        } else if (args.queryIdentity) {
            let ofSameIdentity = Array.from(this._byType.values())
                .map(x => x.get(args.queryIdentity))
                .filter(x => x);

            return _.flatten(ofSameIdentity.map(x => Array.from(x.values()))).length;
        }
    }

    private _getAllQueryCache<T>(entityType: IEntityType<T>): AllQueryCache<T> {
        let cache = this._allQueryCaches.get(entityType) as AllQueryCache<T>;

        if (!cache) {
            cache = new AllQueryCache<T>();
            this._allQueryCaches.set(entityType, cache);
        }

        return cache;
    }

    private _getByIndexesQueryCache<T>(entityType: IEntityType<T>): ByIndexesQueryCache<T> {
        let cache = this._byIndexesCaches.get(entityType) as ByIndexesQueryCache<T>;

        if (!cache) {
            cache = new ByIndexesQueryCache<T>();
            this._byIndexesCaches.set(entityType, cache);
        }

        return cache;
    }

    private _getByKeyQueryCache<T>(entityType: IEntityType<T>): ByKeyQueryCache<T> {
        let cache = this._byKeyCaches.get(entityType) as ByKeyQueryCache<T>;

        if (!cache) {
            cache = new ByKeyQueryCache<T>();
            this._byKeyCaches.set(entityType, cache);
        }

        return cache;
    }

    private _perExpansion(entityType: IEntityType<any>, queryIdentity: QueryIdentity): PerExpansions {
        let perIdentity = this._perIdentity(entityType);
        let perExpansions = perIdentity.get(queryIdentity);

        if (!perExpansions) {
            perExpansions = new Map<string, QueryType<any>>();
            perIdentity.set(queryIdentity, perExpansions);
        }

        return perExpansions;
    }

    private _perIdentity(entityType: IEntityType<any>): PerIdentity {
        let queries = this._byType.get(entityType);

        if (!queries) {
            queries = new Map<QueryIdentity, PerExpansions>();
            this._byType.set(entityType, queries);
        }

        return queries;
    }
}
