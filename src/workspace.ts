import * as _ from "lodash";
import { Cache } from "./cache";
import { Collection, getEntityMetadata, EntityMetadata, IEntityType, Reference } from "./metadata";
import { Expansion } from "./expansion";
import { Query } from "./query";

export class Workspace {
    private _caches = new Map<IEntityType, Cache<any, any>>();

    execute(q: Query): Promise<Map<any, any>> {
        let result: Map<any, any> = new Map();

        if (q instanceof Query.All) {
            result = this.all({
                type: q.entityType,
                expansion: q.expansions.slice()
            });
        } else if (q instanceof Query.ByKey) {
            let item = this.get({
                key: q.key,
                type: q.entityType,
                expansion: q.expansions.slice()
            });

            result.set(q.key, item);
        } else if (q instanceof Query.ByKeys) {
            result = this.getMany({
                keys: q.keys,
                type: q.entityType,
                expansion: q.expansions.slice()
            });
        } else if (q instanceof Query.ByIndex) {
            result = this.byIndex({
                index: q.index,
                value: q.value,
                type: q.entityType,
                expansion: q.expansions.slice()
            });
        } else if (q instanceof Query.ByIndexes) {
            result = this.byIndexes({
                indexes: q.indexes,
                type: q.entityType,
                expansion: q.expansions.slice()
            });
        }

        return Promise.resolve(result)
    }

    add(args: {
        entity: { [key: string]: any };
        type: IEntityType;
        expansion?: string | Expansion[];
    }): void {
        let metadata = this._getMetadata(args.type);
        let cache = this._getCache(args.type);
        let expansions = new Array<Expansion>();

        if (args.expansion != null) {
            if (args.expansion instanceof Array) {
                expansions = args.expansion as Expansion[];
            } else {
                expansions = Expansion.parse(args.type, args.expansion as string);
            }
        }

        cache.add(metadata.withoutNavigationProperties(args.entity));

        expansions.forEach(ex => {
            let value = args.entity[ex.property.name];
            let otherType = ex.property.otherType;

            if (value instanceof Array) {
                if (value.length > 0) {
                    let keyName = (ex.property as Collection).backReferenceKeyName;
                    let otherCache = this._getCache(otherType);
                    otherCache.removeByIndex(keyName, value[0][keyName]);

                    (value as any[]).forEach(v => {
                        this.add({ entity: v, type: otherType, expansion: ex.expansions.slice() });
                    });
                }
            } else {
                this.add({ entity: value, type: otherType, expansion: ex.expansions.slice() });
            }
        });
    }

    get<T>(args: {
        key: any;
        type: IEntityType;
        expansion?: string | Expansion[];
    }): T {
        let item = this._getCache(args.type).get(args.key);
        if (item == null) return null;
        item = _.cloneDeep(item);

        let metadata = this._getMetadata(args.type);
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
        type: IEntityType;
        expansion?: string | Expansion[];
    }): Map<any, T> {
        let items = this._getCache(args.type).getMany(args.keys)._map(i => _.cloneDeep(i));
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
        type: IEntityType;
        expansion?: string | Expansion[];
    }): Map<any, T> {
        let items = this._getCache(args.type).all()._map(i => _.cloneDeep(i));
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
        type: IEntityType;
        expansion?: string | Expansion[];
    }): Map<any, T> {
        let items = this._getCache(args.type).byIndex(args.index, args.value)._map(i => _.cloneDeep(i));
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
        indexes: Map<string, any>;
        type: IEntityType;
        expansion?: string | Expansion[];
    }): Map<any, T> {
        let items = this._getCache(args.type).byIndexes(args.indexes)._map(i => _.cloneDeep(i));
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
        type: IEntityType;
    }): void {
        let cache = this._getCache(args.type);

        if (cache == null) {
            throw `can't remove item: type ${args.type} is not a known type`;
        }

        cache.remove(args.item);
    }

    /**
     * The code of this function was once duplicated @ get(), all() and ofIndex() functions.
     * Interestingly enough it was faster that way by about 15% (@ Chrome).
     */
    private _expand(args: {
        items: Map<any, any>;
        expansions: Expansion[];
        ownerType: IEntityType;
    }): void {
        args.expansions.forEach(expansion => {
            let name = expansion.property.name;
            let otherType = expansion.property.otherType;

            if (expansion.property instanceof Reference) {
                let keyName = expansion.property.keyName;

                args.items.forEach(item => item[name] = this.get({
                    key: item[keyName],
                    type: otherType,
                    expansion: expansion.expansions.slice()
                }));
            } else if (expansion.property instanceof Collection) {
                let keyName = this._getMetadata(expansion.property.otherType).getReference(expansion.property.backReferenceName).keyName;
                let pkName = this._getMetadata(args.ownerType).primaryKey.name;

                args.items.forEach(item => item[name] = this.byIndex({
                    index: keyName,
                    value: item[pkName],
                    type: otherType,
                    expansion: expansion.expansions.slice()
                })._toArray());
            }
        });
    }

    private _getMetadata(type: IEntityType): EntityMetadata {
        let metadata = getEntityMetadata(type);

        if (metadata == null) {
            throw `no metadata for ${type.name} found`;
        }

        return metadata;
    }

    private _getCache(type: IEntityType): Cache<any, any> {
        if (!this._caches.has(type)) {
            let indexes: { [key: string]: (item: any) => any } = {};
            let metadata = this._getMetadata(type);
            metadata.primitives.filter(p => p.index).forEach(p => indexes[p.name] = item => item[p.name]);
            metadata.references.forEach(r => indexes[r.keyName] = (item: any) => item[r.keyName]);

            let cache = new Cache<any, any>({
                getter: item => item[metadata.primaryKey.name],
                indexes
            });

            this._caches.set(type, cache);
        }

        return this._caches.get(type);
    }
}
