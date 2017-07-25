import { ArrayLike, Indexable } from "../util";
import { Expansion, Query, QueryType } from "../elements";
import { EntityMapper } from "../mapping";
import { IEntity, IEntityClass, EntityMetadata, NavigationType, getEntityMetadata, Reference, Children, Collection } from "../metadata";
import { ObjectCache } from "./object-cache";

type EntityCache = ObjectCache<any, IEntity>;

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

        switch (query.type) {
            case "key":
                {
                    let item = cache.get(query.key);

                    if (item) {
                        item = EntityMapper.entitiesToEntities([item], metadata)[0];
                        this._hydrate([item], metadata, query.expansions);
                    }

                    return item;
                }

            case "keys": return this._hydrate(EntityMapper.entitiesToEntities(cache.getManyAsArray(query.keys), metadata), metadata, query.expansions);
            case "indexes": return this._hydrate(EntityMapper.entitiesToEntities(cache.byIndexesAsArray(query.indexes), metadata), metadata, query.expansions);
            case "all": return this._hydrate(EntityMapper.entitiesToEntities(cache.allAsArray(), metadata), metadata, query.expansions);
        }
    }

    hydrate(entities: ArrayLike<IEntity>, expand: ArrayLike<Expansion>): ArrayLike<IEntity> {
        if (entities.length == 0) return [];

        return this._hydrate(entities, getEntityMetadata(entities[0].constructor), expand);
    }

    private _hydrate(entities: ArrayLike<IEntity>, metadata: EntityMetadata<any>, expand: ArrayLike<Expansion>): ArrayLike<IEntity> {
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
            let copies = EntityMapper.entitiesToEntities(cache.getManyAsArray(Array.from(ids.values())), ref.otherTypeMetadata);
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

        this._hydrate(Array.from(related.values()), getEntityMetadata(ref.otherType), expansion.expansions);
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

            let children = EntityMapper.entitiesToEntities(cache.byIndexAsArray(backRefKeyName, parent[pkName]), otherMetadata);
            parent[childrenPropName] = children;
            let length_e = children.length;

            for (let e = 0; e < length_e; ++e) {
                children[e][backRefName] = parent;
                all.push(children[e]);
            }
        }

        this._hydrate(all, otherMetadata, expansion.expansions);
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
            let collected = EntityMapper.entitiesToEntities(cache.getManyAsArray(collector[keysName]), otherMetadata);
            allPerEntity.push(collected);
            collector[prop] = collected;
        }

        this._hydrate([].concat(...allPerEntity), otherMetadata, expansion.expansions);
    }

    addEntities(entities: IEntity[], metadata: EntityMetadata<any>, expand?: ArrayLike<Expansion>): void {
        let cache = this._getEntityCache(metadata);
        let copied = EntityMapper.entitiesToEntities(entities, metadata);

        cache.addMany(copied);
        if (!expand) return;

        let length = expand.length;
        let expansion: Expansion = null;

        for (let i = 0; i < length; ++i) {
            expansion = expand[i];

            let related = this._collect(entities, expansion.property as NavigationType);
            if (related.length == 0) continue;

            let nav = expansion.property as NavigationType;

            if (nav.type == "array:child") {
                let childCache = this._getEntityCache(nav.otherTypeMetadata);
                let backRef = nav.otherTypeMetadata.getBackReference(nav);

                for (let e = 0; e < entities.length; ++e) {
                    childCache.removeByIndex(backRef.keyName, entities[e][metadata.primaryKey.name]);
                }
            }

            this.addEntities(related, expansion.property.otherTypeMetadata, expansion.expansions);
        }
    }

    addDtos(dtos: Indexable[], metadata: EntityMetadata<any>, expand?: ArrayLike<Expansion>): void {
        let cache = this._getEntityCache(metadata);
        let entities = EntityMapper.dtosToEntities(dtos, metadata);

        cache.addMany(entities);
        if (!expand) return;

        let length = expand.length;
        let expansion: Expansion = null;

        for (let i = 0; i < length; ++i) {
            expansion = expand[i];

            let related = this._collect(dtos, expansion.property as NavigationType, true);
            if (related.length == 0) continue;

            let nav = expansion.property as NavigationType;

            if (nav.type == "array:child") {
                let childCache = this._getEntityCache(nav.otherTypeMetadata);
                let backRef = nav.otherTypeMetadata.getBackReference(nav);

                for (let parent of entities) {
                    childCache.removeByIndex(backRef.keyName, parent[metadata.primaryKey.alias]);
                }
            }

            this.addDtos(related, expansion.property.otherTypeMetadata, expansion.expansions);
        }
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
