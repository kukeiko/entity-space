import { StringIndexable } from "../util";
import { Expansion, Query } from "../elements";
import { EntityMapper } from "../mapping";
import { IEntity, EntityType, ClassMetadata, Navigation, getMetadata, Reference, Children, Collection } from "../metadata";
import { ObjectCache } from "./object-cache";
import { hasBuilderFor } from "./builder";
import { BuilderProvider } from "./builder-provider";

type EntityCache = ObjectCache<any, IEntity>;

export class Workspace {
    private _caches = new Map<EntityType<IEntity>, EntityCache>();
    private _builderProvider: BuilderProvider;

    constructor(builderProvider?: BuilderProvider) {
        this._builderProvider = builderProvider || null;
    }

    execute<T>(query: Query<T>): T[];
    execute<T>(query: Query<T>, asMap: true): Map<any, T>;
    execute<T>(...args: any[]): T[] | Map<any, T> {
        let query = args[0] as Query<T>;
        let asMap = args[1] != null;

        let metadata = getMetadata(query.entityType);
        let cache = this._getEntityCache(metadata);
        let cached: T[] = [];

        switch (query.identity.type) {
            case "ids": cached = cache.byKeysAsArray(query.identity.ids); break;
            case "indexes": cached = cache.byIndexesAsArray(query.identity.criteria); break;
            case "all": cached = cache.allAsArray(); break;
        }

        if (query.filter) {
            cached = query.filter.filter(cached);
        }

        let entities = EntityMapper.copyPrimitives({
            from: cached,
            metadata: metadata
        });

        let hydrated = this._hydrateNavigations(entities, metadata, query.expansions);

        if (asMap) {
            let map = new Map<any, T>();
            let pkName = metadata.primaryKey.name;

            for (let i = 0; i < hydrated.length; ++i) {
                // todo: dirty cast to T
                map.set(entities[i][pkName], hydrated[i] as T);
            }

            return map;
        } else {
            if (metadata.sorter) {
                // todo: dirty cast to T[]
                return (hydrated as T[]).sort(metadata.sorter);
            }

            // todo: dirty cast to T[]
            return hydrated as T[];
        }
    }

    hydrate(entities: IEntity[], expand: ArrayLike<Expansion>): ArrayLike<IEntity> {
        if (entities.length == 0) return [];

        // todo: dirty casting
        return this._hydrateNavigations(entities, getMetadata(entities[0].constructor as EntityType<any>), expand);
    }

    add(items: IEntity[] | StringIndexable[], metadata: ClassMetadata<any>, expand?: ArrayLike<Expansion>, isDto?: boolean): void {
        let copied = EntityMapper.copyPrimitives({ from: items, metadata: metadata, fromDto: isDto });
        let cache = this._getEntityCache(metadata);
        cache.add(copied);

        if (!expand) return;

        let length = expand.length;
        let expansion: Expansion = null;
        let pkName = isDto
            ? metadata.primaryKey.dtoName
            : metadata.primaryKey.name;

        for (let i = 0; i < length; ++i) {
            expansion = expand[i];

            let related = EntityMapper.collectNavigation(items, expansion.property, isDto);
            if (related.length == 0) continue;

            let nav = expansion.property as Navigation;

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

    remove(items: IEntity[], metadata: ClassMetadata<any>, expand?: ArrayLike<Expansion>): void {
        this._getEntityCache(metadata).remove(items);

        if (!expand) return;

        this._hydrateNavigations(items, metadata, expand);

        let length = expand.length;
        let expansion: Expansion = null;

        for (let i = 0; i < length; ++i) {
            expansion = expand[i];

            let related = EntityMapper.collectNavigation(items, expansion.property);
            this.remove(related, expansion.property.otherTypeMetadata, expansion.expansions);
        }
    }

    clear(type?: EntityType<any>): void {
        if (!type) {
            this._caches.clear();
        } else if (this._caches.has(type)) {
            this._caches.get(type).clear();
        }
    }

    private _hydrateNavigations(entities: IEntity[], metadata: ClassMetadata<any>, expand: ArrayLike<Expansion>): ArrayLike<IEntity> {
        let expansion: Expansion;

        for (let i = 0; i < expand.length; ++i) {
            expansion = expand[i];
            let nav = expansion.property as Navigation;

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

        if (this._builderProvider != null && hasBuilderFor(metadata.entityType)) {
            this._builderProvider.get(metadata.entityType).build(entities);
        }

        return entities;
    }

    private _hydrateReference(entities: ArrayLike<IEntity>, metadata: ClassMetadata<any>, expansion: Expansion): void {
        let ref = expansion.property as Reference;
        let keyName = ref.keyName;
        let otherTypeKeyName = ref.otherTypeMetadata.primaryKey.name;
        let relatedIds = EntityMapper.collectLocal(Array.from(entities), metadata.getPrimitive(keyName));
        let related = new Map<any, any>();

        {
            let cache = this._getEntityCache(ref.otherTypeMetadata);
            let copies = EntityMapper.copyPrimitives({ from: cache.byKeysAsArray(relatedIds), metadata: ref.otherTypeMetadata });

            for (let i = 0; i < copies.length; ++i) {
                related.set(copies[i][otherTypeKeyName], copies[i]);
            }
        }

        let prop = ref.name;
        let entity: IEntity;

        for (let e = 0; e < entities.length; ++e) {
            entity = entities[e];
            entity[prop] = related.get(entity[keyName]) || null;
        }

        this._hydrateNavigations(Array.from(related.values()), ref.otherTypeMetadata, expansion.expansions);
    }

    private _hydrateChildren(parents: ArrayLike<IEntity>, metadata: ClassMetadata<any>, expansion: Expansion): void {
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

    private _hydrateCollection(collectors: ArrayLike<IEntity>, metadata: ClassMetadata<any>, expansion: Expansion): void {
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

    private _getEntityCache(metadata: ClassMetadata<any>): ObjectCache<any, any> {
        let type = metadata.entityType;

        if (!this._caches.has(type)) {
            this._caches.set(type, this._createEntityCache(metadata));
        }

        return this._caches.get(type);
    }

    private _createEntityCache(metadata: ClassMetadata<any>): EntityCache {
        let indexes: { [key: string]: (item: StringIndexable) => number | string } = {};

        metadata.primitives.filter(p => p.index).forEach(p => indexes[p.name] = item => item[p.name]);

        return new ObjectCache<any, any>({
            getKey: item => item[metadata.primaryKey.name],
            indexes
        });
    }
}
