import * as _ from "lodash";
import { StringIndexable } from "../util";
import { getMetadata, AnyEntityType, EntityType, IEntity, Children, Navigation } from "../metadata";
import { Path, Query, Expansion, Filter, Saveable, Saveables, ByIndexes } from "../elements";
import { QueryCache, Workspace, BuilderProvider } from "../caching";
import { Service } from "./service";
import { ServiceProvider } from "./service-provider";
import { EntityMapper } from "../mapping";

export class ServiceCluster {
    private _serviceProvider: ServiceProvider = null;
    private _services = new Map<EntityType<any>, Service>();
    private _queryCache = new QueryCache();
    private _workspace: Workspace;
    private _pendingQueries = new Map<EntityType<any>, { query: Query<any>, promise: Promise<any> }[]>();

    constructor(serviceProvider?: ServiceProvider, builderProvider?: BuilderProvider) {
        this._serviceProvider = serviceProvider || null;
        this._workspace = new Workspace(builderProvider);
    }

    loadAll<T>(type: EntityType<T>, expand?: string | ArrayLike<Expansion>): Promise<T[]>;
    loadAll<T, K>(type: EntityType<T>, expand: string | ArrayLike<Expansion>, asMap: true): Promise<Map<K, T>>;
    loadAll<T, K>(...args: any[]): Promise<any> {
        let type = args[0] as EntityType<T>;
        let expand = (args[1] || []) as string | ArrayLike<Expansion>;
        let asMap: true = args[2] != null ? true : null;

        return this.executeQuery(Query.All({
            entity: type,
            expand: expand
        }), asMap);
    }

    loadById<T>(type: EntityType<T>, key: any, expand?: string | ArrayLike<Expansion>): Promise<T> {
        return this.executeQuery(Query.ByIds({
            ids: [key],
            entity: type,
            expand: expand
        })).then(items => {
            return items[0] || null;
        });
    }

    loadByIds<T>(type: EntityType<T>, keys: any[], expand?: string | ArrayLike<Expansion>): Promise<T[]>;
    loadByIds<T, K>(type: EntityType<T>, keys: K[], expand: string | ArrayLike<Expansion>, asMap: true): Promise<Map<K, T>>;
    loadByIds<T, K>(...args: any[]): Promise<T[] | Map<K, T>> {
        let type = args[0] as EntityType<T>;
        let keys = args[1] as any[];
        let expand = (args[2] || []) as string | ArrayLike<Expansion>;
        let asMap: true = args[3] != null ? true : null;

        if (keys.length == 0) {
            return Promise.resolve(asMap ? new Map() : []);
        }

        return this.executeQuery(Query.ByIds({
            ids: keys,
            entity: type,
            expand: expand
        }), asMap);
    }

    loadByIndexes<T>(type: EntityType<T>, criteria: ByIndexes.Criteria, expand?: string | ArrayLike<Expansion>, filter?: Filter.Criteria): Promise<T[]>;
    loadByIndexes<T, K>(type: EntityType<T>, criteria: ByIndexes.Criteria, expand: string | ArrayLike<Expansion>, filter: Filter.Criteria, asMap: true): Promise<Map<K, T>>;
    loadByIndexes<T, K>(...args: any[]): Promise<T[] | Map<K, T>> {
        let type = args[0] as EntityType<T>;
        let indexes = args[1] as ByIndexes.Criteria;
        let expand = (args[2] || []) as string | ArrayLike<Expansion>;
        let criteria = args[3] as Filter.Criteria;
        let asMap: true = args[4] != null ? true : null;

        return this.executeQuery(Query.ByIndexes({
            criteria: indexes,
            entity: type,
            expand: expand,
            filter: criteria
        }), asMap);
    }

    async saveOne<T extends IEntity>(entity: T): Promise<T> {
        let saved = await this.saveMany([entity]);

        return saved[0];
    }

    // todo: refine/refactor (put some stuff into entity-mapper maybe?)
    // todo: consider something like Promise.all<T1, T2, T3...> to handle multiple entity types
    async saveMany<T extends IEntity>(entities: T[]): Promise<T[]> {
        if (entities.length == 0) return;

        let type = entities[0].constructor as EntityType<T>
        let metadata = getMetadata(type);
        let pkName = metadata.primaryKey.name;
        let service = await this._getService(type);

        let saveablesArgs = new Map<AnyEntityType, Saveable<any>[]>();
        let saveables: Saveable<any>[] = [];

        saveablesArgs.set(type, saveables);

        let entityCopies = EntityMapper.copyPrimitives({
            from: entities,
            metadata: metadata
        });

        // todo: maybe make configurable? commented out for now since it does more harm than good
        EntityMapper.updateReferenceKeys({
            from: entities,
            to: entityCopies,
            metadata: metadata
        });

        let dtoCopies = EntityMapper.copyPrimitives({
            from: entityCopies,
            toDto: true,
            metadata: metadata
        });

        let dtoSaveables = EntityMapper.copySaveables({
            from: entityCopies,
            toDto: true,
            metadata: metadata,
        });

        let entitiesPerKey = new Map<any, IEntity>();

        for (let i = 0; i < entities.length; ++i) {
            let key = entities[i][pkName];
            if (key == null) continue;
            entitiesPerKey.set(key, entities[i]);
        }

        let cached = new Map<any, T>();

        if (entitiesPerKey.size > 0) {
            cached = this._workspace.execute(Query.ByIds({
                ids: Array.from(entitiesPerKey.keys()),
                entity: type
            }), true);
        }

        for (let i = 0; i < entities.length; ++i) {
            let entity = entities[i];
            let dtoPatch: StringIndexable = {};
            let key = entity[metadata.primaryKey.name];

            let cachedEntity = cached.get(key);

            if (cachedEntity) {
                let [dtoCachedSaveable] = EntityMapper.copySaveables({
                    from: [cachedEntity],
                    toDto: true,
                    metadata: metadata
                });

                Object.keys(dtoCachedSaveable).forEach(k => {
                    let property = metadata.getLocal(k);
                    let newValue = dtoCachedSaveable[k];
                    let oldValue = dtoSaveables[i][k];

                    switch (property.type) {
                        case "primitive":
                            if (newValue !== oldValue) {
                                dtoPatch[k] = dtoSaveables[i][k];
                            }
                            break;

                        case "date":
                            if (!_.isEqual(newValue, oldValue)) {
                                dtoPatch[k] = dtoSaveables[i][k];
                            }
                            break;

                        case "complex":
                        case "instance":
                            switch (property.compareMethod) {
                                case "equals":
                                    // note: not sure why, but _.isEqualWith + _.isMatch fails if the input value is an array is not wrapped in an object
                                    if (newValue instanceof Array || oldValue instanceof Array) {
                                        newValue = { workaround: newValue };
                                        oldValue = { workaround: oldValue };
                                    }

                                    if (!_.isEqualWith(newValue, oldValue, _.isMatch) || !_.isEqualWith(oldValue, newValue, _.isMatch)) {
                                        dtoPatch[k] = dtoSaveables[i][k];
                                    }

                                    break;

                                case "equals-ordered":
                                    if (!_.isEqual(newValue, oldValue)) {
                                        dtoPatch[k] = dtoSaveables[i][k];
                                    }
                                    break;
                            }
                            break;
                    }
                });

                if (Object.keys(dtoPatch).length == 0) {
                    continue;
                }
            } else {
                [dtoPatch] = EntityMapper.copyPrimitives({
                    from: [entityCopies[i]],
                    metadata: metadata,
                    toDto: true
                });
            }

            saveables.push({
                isNew: key == null,
                origin: entity,
                dto: {
                    full: dtoCopies[i],
                    patch: dtoPatch,
                    saveable: dtoSaveables[i]
                }
            });
        }

        let saved = (await service.save(new Saveables(saveablesArgs))).get(type);
        this._workspace.add(saved, metadata, null, true);

        let pkDtoName = metadata.primaryKey.dtoName;
        let keys = new Set<any>();

        entities.forEach(e => e[pkName] && keys.add(e[pkName]));
        saved.forEach(s => keys.add(s[pkDtoName]));

        return this._workspace.execute(Query.ByIds({ ids: Array.from(keys), entity: type }));
    }

    executeQuery<T extends IEntity>(query: Query<T>): Promise<T[]>;
    executeQuery<T extends IEntity>(query: Query<T>, asMap: true): Promise<Map<any, T>>;
    executeQuery<T extends IEntity>(...args: any[]): Promise<T[] | Map<any, T>> {
        let query = args[0] as Query<T>;
        let asMap: true = args[1] != null ? true : null;

        return this._loadIntoWorkspace(query).then(() => {
            return this._workspace.execute(query, asMap);
        });
    }

    flush(args?: {
        entityType?: EntityType<any>;
    }): void {
        args = args || {};

        if (args.entityType) {
            this._workspace.clear(args.entityType);
            this._queryCache.clear(args.entityType);
        } else {
            this._workspace.clear();
            this._queryCache.clear();
        }
    }

    register<T>(entityType: EntityType<T>, executer: Service): void {
        this._services.set(entityType, executer);
    }

    // todo: clean up children @ workspace
    async delete(entities: IEntity[]): Promise<void> {
        if (!entities || entities.length == 0) return;

        let entityType = entities[0].constructor as EntityType<any>;
        let executer = await this._getService(entityType);

        if (!executer) {
            throw `no service for entity type ${entityType.name} registered`;
        }

        await executer.delete(entities);
        this._workspace.remove(entities, getMetadata(entityType));
    }

    /**
     * Make sure that the payload of the provided query exists in the workspace.
     */
    private async _loadIntoWorkspace(query: Query<any>): Promise<void> {
        // extract all navigations that should be loaded separately
        let [noVirtuals, virtuals] = query.extract(exp => exp.property.virtual);

        let reduced = this._queryCache.reduce(noVirtuals);

        if (reduced) {
            let entities = await this._loadFromService(reduced);

            this._workspace.add(entities, getMetadata(query.entityType), reduced.expansions, true);
            this._queryCache.merge(reduced, entities);
        }

        if (virtuals.length > 0) {
            let entities = this._workspace.execute(noVirtuals);
            let promises: Promise<void>[] = [];

            virtuals.forEach(v => {
                let crawled = this._crawl(entities, v.path);
                let nav = v.extracted.property as Navigation;

                switch (nav.type) {
                    case "reference":
                        let keys = new Set<any>();
                        let keyName = nav.keyName;

                        crawled.forEach(e => {
                            if (e[keyName] == null) return;
                            keys.add(e[keyName]);
                        });

                        if (keys.size > 0) {
                            promises.push(this._loadIntoWorkspace(Query.ByIds({
                                ids: Array.from(keys),
                                entity: nav.otherType,
                                expand: v.extracted.expansions
                            })));
                        }
                        break;

                    case "children":
                        let backRef = getMetadata(nav.otherType).getBackReference(nav);
                        let parentKeyName = backRef.keyName;
                        let pkName = getMetadata(backRef.otherType).primaryKey.name;

                        crawled.forEach(item => {
                            let parentKey = item[pkName];

                            promises.push(this._loadIntoWorkspace(Query.ByIndexes({
                                criteria: { [parentKeyName]: parentKey },
                                entity: nav.otherType,
                                expand: v.extracted.expansions
                            })));
                        });
                        break;

                    case "collection":
                        let refKeys = new Set<any>();
                        let keysName = nav.keysName;

                        crawled.forEach(e => {
                            let keys = e[keysName];
                            if (!(keys instanceof Array)) return;
                            keys.forEach(k => refKeys.add(k));
                        });

                        if (refKeys.size > 0) {
                            promises.push(this._loadIntoWorkspace(Query.ByIds({
                                ids: Array.from(refKeys),
                                entity: nav.otherType,
                                expand: v.extracted.expansions
                            })));
                        }
                        break;
                }
            });

            await Promise.all(promises);
        }
    }

    /**
     * Load entities from a service by looking up the service associated with the entity type of the query.
     *
     * The query must not contain any virtuals.
     */
    private async _loadFromService(query: Query<any>): Promise<StringIndexable[]> {
        let service = await this._getService(query.entityType);

        if (!service) {
            throw `no service for entity type ${query.entityType.name} registered`;
        }

        let pending = this._pendingQueries.get(query.entityType);

        if (!pending) {
            pending = [];
            this._pendingQueries.set(query.entityType, pending);
        }

        let reduced = query;

        for (let i = 0; i < pending.length; ++i) {
            reduced = pending[i].query.reduce(reduced);

            // todo(?): figure out if returning just one of them can result in payloads
            // that are bigger/smaller (or even invalid?) than expected

            // one fix could be to collect all promises of queries that actually reduced something,
            // then await them and return a flattened array

            if (!reduced) return pending[i].promise;
        }

        let promise = service.load(reduced);
        pending.push({ query: reduced, promise: promise });

        let cleanup = () => pending.splice(pending.findIndex(x => x.query == reduced), 1);
        promise.then(cleanup, cleanup);

        return promise.then(x => x.filter(y => y));
    }

    private async _getService<T extends IEntity>(entityType: EntityType<T>): Promise<Service> {
        let service = this._services.get(entityType);

        if (!service) {
            if (this._serviceProvider) {
                service = await this._serviceProvider.get(entityType);
                this.register(entityType, service);
            } else {
                throw `no service for entity type ${entityType.name} registered`;
            }
        }

        return service;
    }

    private _crawl(entities: any[], path: Path): any[] {
        let items = Array.from(entities.values());

        let next = path;

        while (next) {
            // todo: figure out if Collection should also be considered
            let isArray = next.property instanceof Children;

            if (isArray) {
                items = _.flatten(items.map(item => item[next.property.name])).filter(x => x);
            } else {
                items = items.map(item => item[next.property.name]).filter(x => x);
            }

            next = next.next;
        }

        return items;
    }
}
