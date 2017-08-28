import { getEntityMetadata, EntityType, IEntity, Navigation, EntityMetadata } from "../metadata";
import { Expansion, Query } from "../elements";
import { AllQueryCache } from "./all-query-cache";
import { ByIndexesQueryCache } from "./by-indexes-query-cache";
import { ByIdsQueryKeyCache } from "./by-ids-query-cache";

export class QueryCache {
    private _allQueryCaches = new Map<EntityType<any>, AllQueryCache<any>>();
    private _byIndexesCaches = new Map<EntityType<any>, ByIndexesQueryCache<any>>();
    private _byKeyCaches = new Map<EntityType<any>, ByIdsQueryKeyCache<any>>();

    reduce<T extends IEntity>(query: QueryType<T>): QueryType<T>[] {
        let reducedViaAll = this._getAllQueryCache(query.entityType).reduce(query);
        if (reducedViaAll == null) return [];

        switch (reducedViaAll.type) {
            case "id":
                {
                    let reduced = this._getByKeyQueryCache(reducedViaAll.entityType).reduce(reducedViaAll);
                    return reduced ? [reduced] : [];
                }

            case "ids":
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
            case "id":
            case "ids":
                this._getByKeyQueryCache(query.entityType).merge(query);

                if (payload) {
                    this._buildQueriesFromPayload(getEntityMetadata(query.entityType), payload, query.expansions.slice());
                }
                break;

            case "indexes":
                this._getByIndexesQueryCache(query.entityType).merge(query);

                if (payload) {
                    let metadata = getEntityMetadata(query.entityType);
                    let keys = new Set<any>();

                    payload.forEach(entity => keys.add(entity[metadata.primaryKey.dtoName]));

                    this.merge(new Query.ByIds({
                        entityType: query.entityType,
                        expand: query.expansions.slice(),
                        ids: Array.from(keys.values())
                    }), payload);
                }
                break;

            case "all":
                this._getAllQueryCache(query.entityType).merge(query);

                if (payload) {
                    this._buildQueriesFromPayload(getEntityMetadata(query.entityType), payload, query.expansions.slice());
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
            case "id": return this._getByKeyQueryCache(query.entityType).isCached(query);
            case "ids": return this._getByKeyQueryCache(query.entityType).isCached(query);
            case "indexes": return this._getByIndexesQueryCache(query.entityType).isCached(query);

            default: return false;
        }
    }

    clear(entityType?: EntityType<any>): void {
        if (entityType) {
            this._allQueryCaches.delete(entityType);
            this._byIndexesCaches.delete(entityType);
            this._byKeyCaches.delete(entityType);
        } else {
            this._allQueryCaches = new Map<EntityType<any>, AllQueryCache<any>>();
            this._byIndexesCaches = new Map<EntityType<any>, ByIndexesQueryCache<any>>();
            this._byKeyCaches = new Map<EntityType<any>, ByIdsQueryKeyCache<any>>();
        }
    }

    private _getAllQueryCache<T>(entityType: EntityType<T>): AllQueryCache<T> {
        let cache = this._allQueryCaches.get(entityType) as AllQueryCache<T>;

        if (!cache) {
            cache = new AllQueryCache<T>();
            this._allQueryCaches.set(entityType, cache);
        }

        return cache;
    }

    private _getByIndexesQueryCache<T>(entityType: EntityType<T>): ByIndexesQueryCache<T> {
        let cache = this._byIndexesCaches.get(entityType) as ByIndexesQueryCache<T>;

        if (!cache) {
            cache = new ByIndexesQueryCache<T>();
            this._byIndexesCaches.set(entityType, cache);
        }

        return cache;
    }

    private _getByKeyQueryCache<T>(entityType: EntityType<T>): ByIdsQueryKeyCache<T> {
        let cache = this._byKeyCaches.get(entityType) as ByIdsQueryKeyCache<T>;

        if (!cache) {
            cache = new ByIdsQueryKeyCache<T>();
            this._byKeyCaches.set(entityType, cache);
        }

        return cache;
    }

    // todo: use for loops + make use of EntityMapper.collect() if possible (if not, make it happen),
    // since this function slows down loading from services quite a bit
    private _buildQueriesFromPayload(metadata: EntityMetadata<any>, entities: IEntity[], expansions: Expansion[]): void {
        if (entities.length == 0) return;

        expansions.forEach(exp => {
            let nav = exp.property as Navigation;

            switch (nav.type) {
                case "ref":
                    {
                        let ref = nav;
                        let references: any[] = [];
                        let keys = new Set<any>();

                        entities.forEach(e => {
                            if (e[nav.dtoName] == null) return;

                            let key = e[metadata.getPrimitive(ref.keyName).dtoName];
                            if (keys.has(key)) return;

                            keys.add(key);
                            references.push(e);
                        });

                        let q = new Query.ByIds({
                            entityType: nav.otherType,
                            expand: exp.expansions.slice(),
                            ids: Array.from(keys)
                        });

                        this.merge(q, references);
                    }
                    break;

                // todo: array:child payload can be built into byindexes query (i think)
                case "array:child":
                    {
                        let metadata = getEntityMetadata(nav.otherType);
                        let keyName = metadata.primaryKey.dtoName;
                        let items: any[] = [];
                        let keys = new Set<any>();
                        let backRef = metadata.getBackReference(nav);
                        let backRefKeyName = metadata.getPrimitive(backRef.keyName).dtoName;

                        entities.forEach(e => {
                            let children = e[nav.dtoName] as any[];
                            if (!(children instanceof Array) || children.length == 0) return;

                            children.forEach(child => {
                                let key = child[keyName];
                                if (keys.has(key)) return;

                                keys.add(key);
                                items.push(child);
                            });

                            let byParentIdQuery = new Query.ByIndexes({
                                entityType: nav.otherType,
                                expand: exp.expansions.slice(),
                                indexes: {
                                    [backRefKeyName]: children[0][backRefKeyName]
                                }
                            });

                            this.merge(byParentIdQuery, children);
                        });

                        let q = new Query.ByIds({
                            entityType: nav.otherType,
                            expand: exp.expansions.slice(),
                            ids: Array.from(keys)
                        });

                        this.merge(q, items);
                    }
                    break;

                case "array:ref":
                    {
                        let metadata = getEntityMetadata(nav.otherType);
                        let keyName = metadata.primaryKey.dtoName;
                        let items: any[] = [];
                        let keys = new Set<any>();

                        entities.forEach(e => {
                            if (!(e[nav.dtoName] instanceof Array)) return;

                            (e[nav.dtoName] as any[]).forEach(c => {
                                let key = c[keyName];
                                if (keys.has(key)) return;

                                keys.add(key);
                                items.push(c);
                            });
                        });

                        let q = new Query.ByIds({
                            entityType: nav.otherType,
                            expand: exp.expansions.slice(),
                            ids: Array.from(keys)
                        });

                        this.merge(q, items);
                    }
                    break;
            }
        });
    }
}
