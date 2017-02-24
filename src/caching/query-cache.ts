import { IEntityType, IEntity } from "../metadata";
import { QueryType } from "../elements";
import { AllQueryCache } from "./all-query-cache";
import { ByIndexesQueryCache } from "./by-indexes-query-cache";
import { ByKeyQueryCache } from "./by-key-query-cache";

export class QueryCache {
    private _allQueryCaches = new Map<IEntityType<any>, AllQueryCache<any>>();
    private _byIndexesCaches = new Map<IEntityType<any>, ByIndexesQueryCache<any>>();
    private _byKeyCaches = new Map<IEntityType<any>, ByKeyQueryCache<any>>();

    reduce<T extends IEntity>(query: QueryType<T>): QueryType<T>[] {
        /**
         * todo: also consider QueryAllCache where applicable, will require comparing
         * expansion weights which should be offloaded into a separate class (since query caches
         * will also make use of it)
         */

        switch (query.type) {
            case "key":
                {
                    let reduced = this._getByKeyQueryCache(query.entityType).reduce(query);
                    return reduced ? [reduced] : [];
                }

            case "keys":
                return this._getByKeyQueryCache(query.entityType).reduce(query);

            case "indexes":
                {
                    let reduced = this._getByIndexesQueryCache(query.entityType).reduce(query);
                    return reduced ? [reduced] : [];
                }

            case "all":
                {
                    let reduced = this._getAllQueryCache(query.entityType).reduce(query);
                    return reduced ? [reduced] : [];
                }

            default:
                throw `incompatible query: ${query}`;
        }
    }

    add(query: QueryType<any>): void {
        switch (query.type) {
            case "key":
            case "keys":
                this._getByKeyQueryCache(query.entityType).add(query);
                break;

            case "indexes":
                this._getByIndexesQueryCache(query.entityType).add(query);
                break;

            case "all":
                this._getAllQueryCache(query.entityType).add(query);
                break;

            default:
                throw `incompatible query: ${query}`;
        }
    }

    isCached(query: QueryType<any>): boolean {
        let allCache = this._getAllQueryCache(query.entityType);
        if (allCache.isCached(query)) return true;

        switch (query.type) {
            case "key": return this._getByKeyQueryCache(query.entityType).isCached(query);
            case "keys": return this._getByKeyQueryCache(query.entityType).isCached(query);
            case "indexes": return this._getByIndexesQueryCache(query.entityType).isCached(query);

            default: return false;
        }
    }

    clear(args?: {
        entityType?: IEntityType<any>;
    }): void {
        args = args || {};

        if (args.entityType) {
            this._allQueryCaches.delete(args.entityType);
            this._byIndexesCaches.delete(args.entityType);
            this._byKeyCaches.delete(args.entityType);
        } else {
            this._allQueryCaches = new Map<IEntityType<any>, AllQueryCache<any>>();
            this._byIndexesCaches = new Map<IEntityType<any>, ByIndexesQueryCache<any>>();
            this._byKeyCaches = new Map<IEntityType<any>, ByKeyQueryCache<any>>();
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
}
