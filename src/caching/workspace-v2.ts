import { ArrayLike, Indexable } from "../util";
import { Expansion, Query, QueryType } from "../elements";
import { EntityMapper } from "../mapping";
import { IEntity, IEntityClass, EntityMetadata, NavigationType, getEntityMetadata, Reference, Children, Collection } from "../metadata";
import { ObjectCache } from "./object-cache";

type EntityCache = ObjectCache<any, IEntity>;
export type EntityLike = IEntity | Indexable;

// todo: refactor common body of addEntities() & addDtos()
export class WorkspaceV2 {
    private _caches = new Map<IEntityClass<IEntity>, EntityCache>();

    execute<T>(query: Query.ByKey<T>): T;
    execute<T>(query: Query.ByKeys<T>): T[];
    execute<T>(query: Query.All<T>): T[];
    execute<T>(query: Query.ByIndexes<T>): T[];
    execute<T>(...args: any[]): any {
        let query: QueryType<any> = args[0];
        let metadata = getEntityMetadata(query.entityType);
        let cache = this._getEntityCache(metadata);

        let cached: Partial<T>[] = [];

        switch (query.type) {
            case "key": cached = [cache.byKey(query.key)].filter(x => x); break;
            case "keys": cached = cache.byKeysAsArray(query.keys); break;
            case "indexes": cached = cache.byIndexesAsArray(query.indexes); break;
            case "all": cached = cache.allAsArray(); break;
        }

        let entities = EntityMapper.copyPrimitives({
            from: cached,
            metadata: metadata
        });

        return this._hydrateNavigations(entities, metadata, query.expansions);
    }

    hydrate(entities: ArrayLike<IEntity>, expand: ArrayLike<Expansion>): ArrayLike<IEntity> {
        if (entities.length == 0) return [];

        return this._hydrateNavigations(entities, getEntityMetadata(entities[0].constructor), expand);
    }

    add(items: IEntity[] | Indexable[], metadata: EntityMetadata<any>, expand?: ArrayLike<Expansion>, isDto?: boolean): void {
        let copied = isDto
            ? EntityMapper.copyPrimitives({ from: items, metadata: metadata, fromDto: true })
            : EntityMapper.copyPrimitives({ from: items, metadata: metadata });

        let cache = this._getEntityCache(metadata);
        cache.add(copied);

        if (!expand) return;

        let length = expand.length;
        let expansion: Expansion = null;
        let pkName = isDto
            ? metadata.primaryKey.alias
            : metadata.primaryKey.name;

        for (let i = 0; i < length; ++i) {
            expansion = expand[i];

            let related = this._collect(items, expansion.property as NavigationType, isDto);
            if (related.length == 0) continue;

            let nav = expansion.property as NavigationType;

            if (nav.type == "array:child") {
                let childCache = this._getEntityCache(nav.otherTypeMetadata);
                let backRef = nav.otherTypeMetadata.getBackReference(nav);

                for (let e = 0; e < items.length; ++e) {
                    childCache.removeByIndex(backRef.keyName, items[e][pkName]);
                }
            }

            this.add(related, expansion.property.otherTypeMetadata, expansion.expansions, isDto);
        }
    }

    remove(items: EntityLike[], metadata: EntityMetadata<any>, expand?: ArrayLike<Expansion>, isDto?: boolean): void {
        this._getEntityCache(metadata).remove(items);

        if (!expand) return;

        this._hydrateNavigations(items, metadata, expand);

        let length = expand.length;
        let expansion: Expansion = null;

        for (let i = 0; i < length; ++i) {
            expansion = expand[i];

            let related = this._collect(items, expansion.property as NavigationType, isDto);
            this.remove(related, expansion.property.otherTypeMetadata, expansion.expansions, isDto);
        }
    }

    clear(): void {
        this._caches.clear();
    }

    private _hydrateNavigations(entities: ArrayLike<IEntity>, metadata: EntityMetadata<any>, expand: ArrayLike<Expansion>): ArrayLike<IEntity> {
        let expansion: Expansion;

        for (let i = 0; i < expand.length; ++i) {
            expansion = expand[i];
            let nav = expansion.property as NavigationType;

            switch (nav.type) {
                case "ref":
                    this._hydrateReference(entities, metadata, expansion);
                    break;

                case "array:child":
                    this._hydrateChildren(entities, metadata, expansion);
                    break;

                case "array:ref":
                    this._hydrateCollection(entities, metadata, expansion);
                    break;
            }
        }

        return entities;
    }

    private _hydrateReference(entities: ArrayLike<IEntity>, metadata: EntityMetadata<any>, expansion: Expansion): void {
        let ref = expansion.property as Reference;
        let ids = new Set<any>();
        let keyName = ref.keyName;

        let length = entities.length;
        let entity: IEntity;

        for (let e = 0; e < length; ++e) {
            entity = entities[e];
            ids.add(entity[keyName]);
        }

        ids.delete(null);
        ids.delete(undefined);

        let related = new Map<any, any>();

        {
            let cache = this._getEntityCache(ref.otherTypeMetadata);
            let copies = EntityMapper.copyPrimitives({ from: cache.byKeysAsArray(Array.from(ids.values())), metadata: ref.otherTypeMetadata });
            let length = copies.length;

            for (let i = 0; i < length; ++i) {
                related.set(copies[i][ref.otherTypeMetadata.primaryKey.name], copies[i]);
            }
        }

        let prop = ref.name;
        length = entities.length;

        for (let e = 0; e < length; ++e) {
            entity = entities[e];
            entity[prop] = related.get(entity[keyName]) || null;
        }

        this._hydrateNavigations(Array.from(related.values()), getEntityMetadata(ref.otherType), expansion.expansions);
    }

    private _hydrateChildren(parents: ArrayLike<IEntity>, metadata: EntityMetadata<any>, expansion: Expansion): void {
        let childrenNav = expansion.property as Children;
        let otherMetadata = childrenNav.otherTypeMetadata;
        let childrenPropName = childrenNav.name;
        let pkName = metadata.primaryKey.name;
        let backRef = otherMetadata.getBackReference(childrenNav);
        let backRefKeyName = backRef.keyName;
        let backRefName = backRef.name;
        let cache = this._getEntityCache(childrenNav.otherTypeMetadata);
        let all: IEntity[] = [];

        let length_i = parents.length;
        let parent: IEntity;

        for (let i = 0; i < length_i; ++i) {
            parent = parents[i];

            let children = EntityMapper.copyPrimitives({ from: cache.byIndexAsArray(backRefKeyName, parent[pkName]), metadata: otherMetadata });
            parent[childrenPropName] = children;
            let length_e = children.length;

            for (let e = 0; e < length_e; ++e) {
                children[e][backRefName] = parent;
                all.push(children[e]);
            }
        }

        this._hydrateNavigations(all, otherMetadata, expansion.expansions);
    }

    private _hydrateCollection(collectors: ArrayLike<IEntity>, metadata: EntityMetadata<any>, expansion: Expansion): void {
        let nav = expansion.property as Collection;
        let keysName = nav.keysName;
        let prop = nav.name;
        let cache = this._getEntityCache(nav.otherTypeMetadata);
        let otherMetadata = nav.otherTypeMetadata;
        // note: i'm just guessing that concatenating them all at once is faster
        // than doing it in each iteration
        let allPerEntity: IEntity[][] = [];

        let length_i = collectors.length;
        let collector: IEntity;

        for (let i = 0; i < length_i; ++i) {
            collector = collectors[i];
            let collected = EntityMapper.copyPrimitives({ from: cache.byKeysAsArray(collector[keysName]), metadata: otherMetadata });
            allPerEntity.push(collected);
            collector[prop] = collected;
        }

        this._hydrateNavigations([].concat(...allPerEntity), otherMetadata, expansion.expansions);
    }

    private _getEntityCache(metadata: EntityMetadata<any>): ObjectCache<any, any> {
        let type = metadata.entityType;

        if (!this._caches.has(type)) {
            this._caches.set(type, this._createEntityCache(metadata));
        }

        return this._caches.get(type);
    }

    private _createEntityCache(metadata: EntityMetadata<any>): EntityCache {
        let indexes: { [key: string]: (item: Indexable) => number | string } = {};

        metadata.primitives.filter(p => p.index).forEach(p => indexes[p.name] = item => item[p.name]);

        return new ObjectCache<any, any>({
            getKey: item => item[metadata.primaryKey.name],
            indexes
        });
    }

    private _collect(items: Indexable[], nav: NavigationType, dto?: boolean): Indexable[] {
        let name = nav.getName(dto);
        let collected: Indexable[] = [];

        switch (nav.type) {
            case "ref":
                let item: any;
                for (let i = 0; i < items.length; ++i) {
                    item = items[i][name];
                    if (!item) continue;

                    collected.push(item);
                }
                break;

            case "array:ref":
            case "array:child":
                for (let i = 0; i < items.length; ++i) {
                    let array = items[i][name];

                    for (let e = 0; e < array.length; ++e) {
                        collected.push(array[e]);
                    }
                }
                break;
        }

        return collected;
    }
}
