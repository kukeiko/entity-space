import { Cache } from "./cache";
import { Collection, getEntityMetadata, EntityMetadata, IEntityType, Reference } from "./metadata";
import { Expansion } from "./expansion";
import { Query } from "./query";

type EntityCache = Cache<any, any>;
type ByEntityType<T> = Map<IEntityType<any>, T>;

export class Workspace {
    private _caches = new Map<IEntityType<any>, EntityCache>();
    private _contextedCaches = new Map<IEntityType<any>, Map<string, EntityCache>>();

    execute<T>(q: Query<T>): Map<any, T> {
        let result: Map<any, any> = new Map();

        if (q instanceof Query.ByKey) {
            let item = this.get({
                key: q.key,
                type: q.entityType,
                expansion: q.expansions
            });

            result.set(q.key, item);
        } else if (q instanceof Query.ByKeys) {
            result = this.getMany({
                keys: q.keys.slice(),
                type: q.entityType,
                expansion: q.expansions
            });
        } else if (q instanceof Query.ByIndex) {
            result = this.byIndex({
                index: q.index,
                value: q.value,
                type: q.entityType,
                expansion: q.expansions
            });
        } else if (q instanceof Query.ByIndexes) {
            result = this.byIndexes({
                indexes: q.indexes,
                type: q.entityType,
                expansion: q.expansions
            });
        } else if (q instanceof Query.All) {
            result = this.all({
                type: q.entityType,
                expansion: q.expansions
            });
        }

        return result;
    }

    add<T>(args: {
        entity: T;
        type: IEntityType<T>;
        expansion?: string | Expansion[] | ReadonlyArray<Expansion>;
    }): void {
        let metadata = this._getMetadata(args.type);
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
            let otherTypeMetadata = this._getMetadata(otherType);

            if (ex.property instanceof Reference) {
                this.add({
                    entity: value,
                    type: otherType,
                    expansion: ex.expansions
                });
            } else if (ex.property instanceof Collection) {
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

    get<T>(args: {
        key: any;
        type: IEntityType<T>;
        expansion?: string | Expansion[] | ReadonlyArray<Expansion>;
    }): T {
        let item = this._getEntityCache(args.type).get(args.key);
        if (item == null) return null;

        let metadata = this._getMetadata(args.type);
        item = metadata.fromCached(item);
        let expansions = new Array<Expansion>();

        if (args.expansion != null) {
            if (args.expansion instanceof Array) {
                expansions = args.expansion as Expansion[];
            } else {
                expansions = Expansion.parse(args.type, args.expansion as string);
            }
        }

        let map = new Map();
        map.set(item[metadata.primaryKey.name], item);

        this._expand({
            items: map,
            ownerType: args.type,
            expansions: expansions
        });

        return item;
    }

    getMany<T>(args: {
        keys: any[];
        type: IEntityType<T>;
        expansion?: string | Expansion[] | ReadonlyArray<Expansion>;
    }): Map<any, T> {
        let metadata = this._getMetadata(args.type);
        let items = new Map<any, T>();
        this._getEntityCache(args.type).getMany(args.keys)
            .forEach((v, k) => items.set(k, metadata.fromCached(v) as T));

        if (items.size == 0) return items;

        let expansions = new Array<Expansion>();

        if (args.expansion != null) {
            if (args.expansion instanceof Array) {
                expansions = args.expansion as Expansion[];
            } else {
                expansions = Expansion.parse(args.type, args.expansion as string);
            }
        }

        this._expand({
            items: items,
            ownerType: args.type,
            expansions: expansions
        });

        return items;
    }

    all<T>(args: {
        type: IEntityType<T>;
        expansion?: string | Expansion[] | ReadonlyArray<Expansion>;
    }): Map<any, T> {
        let metadata = this._getMetadata(args.type);
        let items = new Map<any, any>();
        this._getEntityCache(args.type).all()
            .forEach((v, k) => items.set(k, metadata.fromCached(v) as T));

        if (items.size == 0) return items;

        let expansions = new Array<Expansion>();

        if (args.expansion != null) {
            if (args.expansion instanceof Array) {
                expansions = args.expansion as Expansion[];
            } else {
                expansions = Expansion.parse(args.type, args.expansion as string);
            }
        }

        this._expand({
            items: items,
            ownerType: args.type,
            expansions: expansions
        });

        return items;
    }

    byIndex<T>(args: {
        index: string;
        value: any;
        type: IEntityType<T>;
        expansion?: string | Expansion[] | ReadonlyArray<Expansion>;
    }): Map<any, T> {
        let metadata = this._getMetadata(args.type);
        let items = new Map<any, any>();
        this._getEntityCache(args.type).byIndex(args.index, args.value)
            .forEach((v, k) => items.set(k, metadata.fromCached(v) as T));

        if (items.size == 0) return items;

        let expansions = new Array<Expansion>();

        if (args.expansion != null) {
            if (args.expansion instanceof Array) {
                expansions = args.expansion as Expansion[];
            } else {
                expansions = Expansion.parse(args.type, args.expansion as string);
            }
        }

        this._expand({
            items: items,
            ownerType: args.type,
            expansions: expansions
        });

        return items;
    }

    byIndexes<T>(args: {
        indexes: { [key: string]: Object };
        type: IEntityType<T>;
        expansion?: string | Expansion[] | ReadonlyArray<Expansion>;
    }): Map<any, T> {
        let metadata = this._getMetadata(args.type);
        let items = new Map<any, any>();
        this._getEntityCache(args.type).byIndexes(args.indexes)
            .forEach((v, k) => items.set(k, metadata.fromCached(v) as T));

        if (items.size == 0) return items;

        let expansions = new Array<Expansion>();

        if (args.expansion != null) {
            if (args.expansion instanceof Array) {
                expansions = args.expansion as Expansion[];
            } else {
                expansions = Expansion.parse(args.type, args.expansion as string);
            }
        }

        this._expand({
            items: items,
            ownerType: args.type,
            expansions: expansions
        });

        return items;
    }

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

    clear(args?: {
        entityType?: IEntityType<any>;
    }): void {
        args = args || {};

        if (args.entityType) {
            let cache = this._getEntityCache(args.entityType);
            cache.clear();
        } else {
            this._caches = new Map<IEntityType<any>, EntityCache>();
            this._contextedCaches = new Map<IEntityType<any>, Map<string, EntityCache>>();
        }
    }

    /**
     * The code of this function was once duplicated @ get(), all() and ofIndex() functions.
     * Interestingly enough it was faster that way by about 15% (@ Chrome).
     */
    private _expand(args: {
        items: Map<any, any>;
        expansions: Expansion[] | ReadonlyArray<Expansion>;
        ownerType: IEntityType<any>;
    }): void {
        args.expansions.slice().forEach(expansion => {
            let name = expansion.property.name;
            let otherType = expansion.property.otherType;

            if (expansion.property instanceof Reference) {
                let keyName = expansion.property.keyName;

                args.items.forEach(item => item[name] = this.get({
                    key: item[keyName],
                    type: otherType,
                    expansion: expansion.expansions
                }));
            } else if (expansion.property instanceof Collection) {
                let backRef = this._getMetadata(expansion.property.otherType).getReference(expansion.property.backReferenceName);
                let keyName = backRef.keyName;
                let pkName = this._getMetadata(args.ownerType).primaryKey.name;

                args.items.forEach(item => {
                    let items = Array.from(this.byIndex<any>({
                        index: keyName,
                        value: item[pkName],
                        type: otherType,
                        expansion: expansion.expansions
                    }), v => v[1]);

                    item[name] = items;
                    items.forEach(i => i[backRef.name] = item);
                });
            }
        });
    }

    private _getMetadata(type: IEntityType<any>): EntityMetadata {
        let metadata = getEntityMetadata(type);

        if (metadata == null) {
            throw `no metadata for ${type.name} found`;
        }

        return metadata;
    }

    private _getEntityCache(type: IEntityType<any>): Cache<any, any> {
        if (!this._caches.has(type)) {
            this._caches.set(type, this._createEntityCache(type));
        }

        return this._caches.get(type);
    }

    private _buildContextKey(contexts: { [key: number]: any }): string {
        let a: any[] = [];

        for (let k in contexts) {
            a[k] = contexts[k];
        }

        let map = new Map<number, any>();
        a.forEach((v, i) => map.set(i, v));

        // todo: stopped here
        throw "NotImplemented";
    }

    private _getContextedEntityCache(args: {
        type: IEntityType<any>;
        contextKey: string;
    }): EntityCache {
        let perContext = this._contextedCaches.get(args.type);

        if (!perContext) {
            perContext = new Map<string, EntityCache>();
            this._contextedCaches.set(args.type, perContext);
        }

        let entities = perContext.get(args.contextKey);

        if (!entities) {
            entities = this._createEntityCache(args.type);
            perContext.set(args.contextKey, );
        }

        return entities;
    }

    private _createEntityCache(type: IEntityType<any>): EntityCache {
        let indexes: { [key: string]: (item: any) => any } = {};
        let metadata = this._getMetadata(type);

        metadata.primitives.filter(p => p.index).forEach(p => indexes[p.name] = item => item[p.name]);

        return new Cache<any, any>({
            getter: item => item[metadata.primaryKey.name],
            indexes
        });
    }
}
