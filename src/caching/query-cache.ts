import { getEntityMetadata, IEntityClass, IEntity, NavigationType } from "../metadata";
import { Expansion, Query, QueryType } from "../elements";
import { AllQueryCache } from "./all-query-cache";
import { ByIndexesQueryCache } from "./by-indexes-query-cache";
import { ByKeyQueryCache } from "./by-key-query-cache";

export class QueryCache {
    private _allQueryCaches = new Map<IEntityClass<any>, AllQueryCache<any>>();
    private _byIndexesCaches = new Map<IEntityClass<any>, ByIndexesQueryCache<any>>();
    private _byKeyCaches = new Map<IEntityClass<any>, ByKeyQueryCache<any>>();

    reduce<T extends IEntity>(query: QueryType<T>): QueryType<T>[] {
        let reducedViaAll = this._getAllQueryCache(query.entityType).reduce(query);
        if (reducedViaAll == null) return [];

        switch (reducedViaAll.type) {
            case "key":
                {
                    let reduced = this._getByKeyQueryCache(reducedViaAll.entityType).reduce(reducedViaAll);
                    return reduced ? [reduced] : [];
                }

            case "keys":
                {
                    return this._getByKeyQueryCache(reducedViaAll.entityType).reduce(reducedViaAll);
                }

            case "indexes":
                {
                    let reduced = this._getByIndexesQueryCache(reducedViaAll.entityType).reduce(reducedViaAll);
                    return reduced ? [reduced] : [];
                }
        }

        return [query];
    }

    merge(query: QueryType<any>, payload?: any[]): void {
        switch (query.type) {
            case "key":
            case "keys":
                this._getByKeyQueryCache(query.entityType).merge(query);

                if (payload) {
                    this._buildQueriesFromPayload(payload, query.expansions.slice());
                }
                break;

            case "indexes":
                this._getByIndexesQueryCache(query.entityType).merge(query);

                if (payload) {
                    let metadata = getEntityMetadata(query.entityType);
                    let keys = new Set<any>();

                    payload.forEach(entity => keys.add(entity[metadata.primaryKey.name]));

                    this.merge(new Query.ByKeys({
                        entityType: query.entityType,
                        expansions: query.expansions.slice(),
                        keys: Array.from(keys.values())
                    }), payload);
                }
                break;

            case "all":
                this._getAllQueryCache(query.entityType).merge(query);

                if (payload) {
                    this._buildQueriesFromPayload(payload, query.expansions.slice());
                }
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
        entityType?: IEntityClass<any>;
    }): void {
        args = args || {};

        if (args.entityType) {
            this._allQueryCaches.delete(args.entityType);
            this._byIndexesCaches.delete(args.entityType);
            this._byKeyCaches.delete(args.entityType);
        } else {
            this._allQueryCaches = new Map<IEntityClass<any>, AllQueryCache<any>>();
            this._byIndexesCaches = new Map<IEntityClass<any>, ByIndexesQueryCache<any>>();
            this._byKeyCaches = new Map<IEntityClass<any>, ByKeyQueryCache<any>>();
        }
    }

    private _getAllQueryCache<T>(entityType: IEntityClass<T>): AllQueryCache<T> {
        let cache = this._allQueryCaches.get(entityType) as AllQueryCache<T>;

        if (!cache) {
            cache = new AllQueryCache<T>();
            this._allQueryCaches.set(entityType, cache);
        }

        return cache;
    }

    private _getByIndexesQueryCache<T>(entityType: IEntityClass<T>): ByIndexesQueryCache<T> {
        let cache = this._byIndexesCaches.get(entityType) as ByIndexesQueryCache<T>;

        if (!cache) {
            cache = new ByIndexesQueryCache<T>();
            this._byIndexesCaches.set(entityType, cache);
        }

        return cache;
    }

    private _getByKeyQueryCache<T>(entityType: IEntityClass<T>): ByKeyQueryCache<T> {
        let cache = this._byKeyCaches.get(entityType) as ByKeyQueryCache<T>;

        if (!cache) {
            cache = new ByKeyQueryCache<T>();
            this._byKeyCaches.set(entityType, cache);
        }

        return cache;
    }

    private _buildQueriesFromPayload(entities: IEntity[], expansions: Expansion[]): void {
        expansions.forEach(exp => {
            let nav = exp.property as NavigationType;

            switch (nav.type) {
                case "ref":
                    {
                        let ref = nav;
                        let references: any[] = [];
                        let keys = new Set<any>();

                        entities.forEach(e => {
                            if (e[nav.name] == null) return;

                            let key = e[ref.keyName];
                            if (keys.has(key)) return;

                            keys.add(key);
                            references.push(e);
                        });

                        let q = new Query.ByKeys({
                            entityType: nav.otherType,
                            expansions: exp.expansions.slice(),
                            keys: Array.from(keys)
                        });

                        this.merge(q, references);
                    }
                    break;

                // todo: array:child payload can be built into byindexes query (i think)
                case "array:child":
                    {
                        let metadata = getEntityMetadata(nav.otherType);
                        let keyName = metadata.primaryKey.name;
                        let items: any[] = [];
                        let keys = new Set<any>();
                        let backRef = metadata.getBackReference(nav);

                        entities.forEach(e => {
                            let children = e[nav.name] as any[];
                            if (!(children instanceof Array) || children.length == 0) return;

                            children.forEach(child => {
                                let key = child[keyName];
                                if (keys.has(key)) return;

                                keys.add(key);
                                items.push(child);
                            });

                            let byParentIdQuery = new Query.ByIndexes({
                                entityType: nav.otherType,
                                expansions: exp.expansions.slice(),
                                indexes: {
                                    [backRef.keyName]: children[0][backRef.keyName]
                                }
                            });

                            this.merge(byParentIdQuery, children);
                        });

                        let q = new Query.ByKeys({
                            entityType: nav.otherType,
                            expansions: exp.expansions.slice(),
                            keys: Array.from(keys)
                        });

                        this.merge(q, items);
                    }
                    break;

                case "array:ref":
                    {
                        let metadata = getEntityMetadata(nav.otherType);
                        let keyName = metadata.primaryKey.name;
                        let items: any[] = [];
                        let keys = new Set<any>();

                        entities.forEach(e => {
                            if (!(e[nav.name] instanceof Array)) return;

                            (e[nav.name] as any[]).forEach(c => {
                                let key = c[keyName];
                                if (keys.has(key)) return;

                                keys.add(key);
                                items.push(c);
                            });
                        });

                        let q = new Query.ByKeys({
                            entityType: nav.otherType,
                            expansions: exp.expansions.slice(),
                            keys: Array.from(keys)
                        });

                        this.merge(q, items);
                    }
                    break;
            }
        });
    }
}
