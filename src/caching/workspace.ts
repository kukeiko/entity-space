import { Cache } from "./cache";
import { getEntityMetadata, IEntityType, IEntity, Children, Reference, NavigationType } from "../metadata";
import { Expansion, Query, QueryType } from "../elements";

type EntityCache = Cache<any, IEntity>;

export class Workspace {
    private _caches = new Map<IEntityType<IEntity>, EntityCache>();

    /**
     * Add one entity into the cache.
     *
     * Use expansions to describe which navigations should be put into the cache as well.
     */
    add<T>(args: {
        entity: T;
        type: IEntityType<T>;
        expansion?: string | Expansion[] | ReadonlyArray<Expansion>;
    }): void {
        let metadata = getEntityMetadata(args.type);
        let cache = this._getEntityCache(args.type);
        let expansions = new Array<Expansion>();

        if (args.expansion != null) {
            if (args.expansion instanceof Array) {
                expansions = args.expansion as Expansion[];
            } else {
                expansions = Expansion.parse(args.type, args.expansion as string);
            }
        }

        cache.add(metadata.createCacheable(args.entity));

        expansions.forEach(ex => {
            let value = (args.entity as any)[ex.property.name];

            /**
             * just because it is in the expansion doesn't mean it has been loaded for this particular entity
             */
            if (!value) return;

            let otherType = ex.property.otherType;
            let otherTypeMetadata = getEntityMetadata(otherType);

            if (ex.property instanceof Reference) {
                this.add({
                    entity: value,
                    type: otherType,
                    expansion: ex.expansions
                });
            } else if (ex.property instanceof Children) {
                let items = value as any[];
                if (items.length == 0) return;

                let reference = otherTypeMetadata.getReference(ex.property.backReferenceName);
                let key = otherTypeMetadata.getPrimitive(reference.keyName);

                let otherCache = this._getEntityCache(otherType);
                otherCache.removeByIndex(key.name, value[0][key.name]);

                items.forEach(v => this.add({
                    entity: v,
                    type: otherType,
                    expansion: ex.expansions
                }));
            }
        });
    }

    /**
     * Add multiple entities into the cache.
     *
     * Use expansions to describe which navigations should be put into the cache as well.
     */
    addMany<T>(args: {
        entities: T[];
        type: IEntityType<T>;
        expansion?: string | Expansion[] | ReadonlyArray<Expansion>;
    }): void {
        let expansions = new Array<Expansion>();

        if (args.expansion != null) {
            if (args.expansion instanceof Array) {
                expansions = args.expansion as Expansion[];
            } else {
                expansions = Expansion.parse(args.type, args.expansion as string);
            }
        }

        args.entities.forEach(e => this.add({
            entity: e,
            expansion: expansions,
            type: args.type
        }));
    }

    /**
     * Remove an entity from the cache.
     *
     * todo: support expansions
     */
    remove(args: {
        item: any;
        type: IEntityType<any>;
    }): void {
        let cache = this._getEntityCache(args.type);

        if (cache == null) {
            throw `can't remove item: type ${args.type} is not a known type`;
        }

        cache.remove(args.item);
    }

    /**
     * Clear all or parts of the cache.
     */
    clear(args?: {
        entityType?: IEntityType<any>;
    }): void {
        args = args || {};

        if (args.entityType) {
            let cache = this._getEntityCache(args.entityType);
            cache.clear();
        } else {
            this._caches = new Map<IEntityType<any>, EntityCache>();
        }
    }

    /**
     * Load entities from the cache.
     */
    execute<T>(q: QueryType<T>): Map<any, T> {
        let metadata = getEntityMetadata(q.entityType);
        let items = new Map<any, T>();
        let cache = this._getEntityCache(q.entityType);

        switch (q.type) {
            case "all":
                cache.all().forEach((v, k) => items.set(k, metadata.fromCached(v) as T));
                break;

            case "key":
                let item = cache.get(q.key);

                if (item) {
                    items.set(q.key, metadata.fromCached(item) as T);
                }
                break;

            case "keys":
                cache.getMany(q.keys.slice()).forEach((v, k) => items.set(k, metadata.fromCached(v) as T));
                break;

            case "index":
                cache.byIndex(q.index, q.value).forEach((v, k) => items.set(k, metadata.fromCached(v) as T));
                break;

            case "indexes":
                cache.byIndexes(q.indexes).forEach((v, k) => items.set(k, metadata.fromCached(v) as T));
                break;

            default:
                throw `incompatible query: ${q}`;
        }

        this._hydrate({
            items: items,
            query: q
        });

        return items;
    }

    /**
     * Expands upon the entities as described in the query.
     */
    private _hydrate(args: {
        query: QueryType<any>;
        items: Map<any, any>;
    }): void {
        args.query.expansions.forEach(exp => {
            let nav = exp.property as NavigationType;

            switch (nav.type) {
                case "ref":
                    let keyName = nav.keyName;

                    args.items.forEach(item =>
                        item[nav.name] = this.execute(new Query.ByKey({
                            entityType: nav.otherType,
                            expansions: exp.expansions.slice(),
                            key: item[keyName]
                        })).get(item[keyName]) || null);
                    break;

                case "array:child":
                    let backRef = getEntityMetadata(nav.otherType).getReference(nav.backReferenceName);
                    let parentKeyName = backRef.keyName;
                    let pkName = getEntityMetadata(args.query.entityType).primaryKey.name;

                    args.items.forEach(item => {
                        let parentKey = item[pkName];

                        let items = this.execute(new Query.ByIndex({
                            entityType: nav.otherType,
                            expansions: exp.expansions.slice(),
                            index: parentKeyName,
                            value: parentKey
                        }));

                        item[nav.name] = Array.from(items.values());
                        items.forEach(i => i[backRef.name] = item);
                    });
                    break;

                case "array:ref":
                    let keysName = nav.keysName;

                    args.items.forEach(item => {
                        let items = this.execute(new Query.ByKeys({
                            entityType: nav.otherType,
                            expansions: exp.expansions.slice(),
                            keys: item[keysName]
                        }));

                        item[nav.name] = Array.from(items.values());
                    });
                    break;

                default:
                    throw `unknown navigation type: ${(nav as any).type}`;
            }
        });
    }

    private _getEntityCache(type: IEntityType<any>): Cache<any, any> {
        if (!this._caches.has(type)) {
            this._caches.set(type, this._createEntityCache(type));
        }

        return this._caches.get(type);
    }

    private _createEntityCache(type: IEntityType<any>): EntityCache {
        let indexes: { [key: string]: (item: any) => any } = {};
        let metadata = getEntityMetadata(type);

        metadata.primitives.filter(p => p.index).forEach(p => indexes[p.name] = item => item[p.name]);

        return new Cache<any, any>({
            getter: item => item[metadata.primaryKey.name],
            indexes
        });
    }
}