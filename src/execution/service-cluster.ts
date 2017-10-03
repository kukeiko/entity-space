import * as _ from "lodash";
import { ArrayLike, ToStringable, StringIndexable } from "../util";
import { getEntityMetadata, AnyEntityType, EntityType, IEntity, Children, NavigationType } from "../metadata";
import { Path, Query, QueryType, Expansion, Saveable, Saveables } from "../elements";
import { QueryCache, Workspace } from "../caching";
import { IService } from "./service.type";
import { EntityMapper } from "../mapping";
import { ServiceProvider } from "./service-provider";

export type IndexCriteria = { [key: string]: ToStringable };

export class ServiceCluster {
    private _serviceProvider: ServiceProvider = null;
    private _services = new Map<EntityType<any>, IService>();
    private _queryCache = new QueryCache();
    private _workspace = new Workspace();
    private _pendingQueries = new Map<EntityType<any>, { query: QueryType<any>, promise: Promise<any> }[]>();

    constructor(serviceProvider?: ServiceProvider) {
        this._serviceProvider = serviceProvider || null;
    }

    loadAll<T>(type: EntityType<T>, expand?: string | ArrayLike<Expansion>): Promise<T[]>;
    loadAll<T, K>(type: EntityType<T>, expand: string | ArrayLike<Expansion>, asMap: true): Promise<Map<K, T>>;
    loadAll<T, K>(...args: any[]): Promise<any> {
        let type = args[0] as EntityType<T>;
        let expand = (args[1] || []) as string | ArrayLike<Expansion>;
        let asMap: true = args[2] != null ? true : null;

        return this.executeQuery(new Query.All({
            entityType: type,
            expand: expand
        }), asMap);
    }

    loadById<T>(type: EntityType<T>, key: any, expand?: string | ArrayLike<Expansion>): Promise<T> {
        return this.executeQuery(new Query.ById({
            entityType: type,
            id: key,
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

        return this.executeQuery(new Query.ByIds({
            entityType: type,
            expand: expand,
            ids: keys
        }), asMap);
    }

    loadByIndexes<T>(type: EntityType<T>, indexes: IndexCriteria, expand?: string | ArrayLike<Expansion>): Promise<T[]>;
    loadByIndexes<T, K>(type: EntityType<T>, indexes: IndexCriteria, expand: string | ArrayLike<Expansion>, asMap: true): Promise<Map<K, T>>;
    loadByIndexes<T, K>(...args: any[]): Promise<T[] | Map<K, T>> {
        let type = args[0] as EntityType<T>;
        let indexes = args[1] as IndexCriteria;
        let expand = (args[2] || []) as string | ArrayLike<Expansion>;
        let asMap: true = args[3] != null ? true : null;

        return this.executeQuery(new Query.ByIndexes({
            entityType: type,
            expand: expand,
            indexes: indexes
        }), asMap);
    }

    async saveOne<T extends IEntity>(entity: T): Promise<T> {
        let saved = await this.saveMany([entity]);

        return saved[0];
    }

    // todo: refine/refactor
    // todo: consider something like Promise.all<T1, T2, T3...> to handle multiple entity types
    async saveMany<T extends IEntity>(entities: T[]): Promise<T[]> {
        if (entities.length == 0) return;

        let type = entities[0].constructor as EntityType<T>;
        let metadata = getEntityMetadata(type);
        let service = await this._getService(type);

        let saveablesArgs = new Map<AnyEntityType, Saveable<any>[]>();
        let saveables: Saveable<any>[] = [];

        saveablesArgs.set(type, saveables);

        let entityCopies = EntityMapper.copyPrimitives({
            from: entities,
            metadata: metadata
        });

        // todo: maybe make configurable? commented out for now since it does more harm than good
        // EntityMapper.updateReferenceKeys({
        //     from: entities,
        //     to: entityCopies,
        //     metadata: metadata
        // });

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
            let key = entities[i][metadata.primaryKey.name];
            if (key == null) continue;
            entitiesPerKey.set(key, entities[i]);
        }

        let cached = this._workspace.execute(new Query.ByIds({
            entityType: type,
            ids: Array.from(entitiesPerKey.keys())
        }), true);

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
                    metadata: metadata
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

        let pkName = metadata.primaryKey.name;
        let pkDtoName = metadata.primaryKey.dtoName;
        let keys = new Set<any>();
        entities.forEach(e => e[pkName] && keys.add(e[pkName]));
        saved.forEach(s => keys.add(s[pkDtoName]));

        return this._workspace.execute(new Query.ByIds({
            entityType: type,
            ids: Array.from(keys)
        }));
    }

    executeQuery<T extends IEntity>(query: QueryType<T>): Promise<T[]>;
    executeQuery<T extends IEntity>(query: QueryType<T>, asMap: true): Promise<Map<any, T>>;
    executeQuery<T extends IEntity>(...args: any[]): Promise<T[] | Map<any, T>> {
        let query = args[0] as QueryType<T>;
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

    register<T>(entityType: EntityType<T>, executer: IService): void {
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
        this._workspace.remove(entities, getEntityMetadata(entityType));
    }

    /**
     * Make sure that the payload of the provided query exists in the workspace.
     */
    private async _loadIntoWorkspace(query: QueryType<any>): Promise<void> {
        // remove all navigations that should be loaded separately
        let [noVirtuals, virtuals] = query.extract(exp => exp.property.virtual);

        // reduce the query by removing navigations that are already loaded
        let reduced = this._queryCache.reduce(noVirtuals);
        let loadReducedPromises: Promise<any>[] = [];

        reduced.forEach(rq => {
            let promise = this._loadFromService(rq)
                .then(entities => {
                    this._workspace.add(entities, getEntityMetadata(query.entityType), rq.expansions, true);
                    this._queryCache.merge(rq, entities);
                });

            loadReducedPromises.push(promise);
        });

        await Promise.all(loadReducedPromises);

        if (virtuals.length > 0) {
            let entities = this._workspace.execute(noVirtuals);
            let promises: Promise<void>[] = [];

            virtuals.forEach(v => {
                let crawled = this._crawl(entities, v.path);
                let nav = v.extracted.property as NavigationType;

                switch (nav.type) {
                    case "ref":
                        let keys = new Set<any>();
                        let keyName = nav.keyName;

                        crawled.forEach(e => {
                            if (e[keyName] == null) return;
                            keys.add(e[keyName]);
                        });

                        promises.push(this._loadIntoWorkspace(new Query.ByIds({
                            entityType: nav.otherType,
                            expand: v.extracted.expansions.slice(),
                            ids: Array.from(keys)
                        })));
                        break;

                    case "array:child":
                        let backRef = getEntityMetadata(nav.otherType).getBackReference(nav);
                        let parentKeyName = backRef.keyName;
                        let pkName = getEntityMetadata(backRef.otherType).primaryKey.name;

                        crawled.forEach(item => {
                            let parentKey = item[pkName];

                            promises.push(this._loadIntoWorkspace(new Query.ByIndexes({
                                entityType: nav.otherType,
                                expand: v.extracted.expansions.slice(),
                                indexes: {
                                    [parentKeyName]: parentKey
                                }
                            })));
                        });
                        break;

                    case "array:ref":
                        let refKeys = new Set<any>();
                        let keysName = nav.keysName;

                        crawled.forEach(e => {
                            let keys = e[keysName];
                            if (!(keys instanceof Array)) return;
                            keys.forEach(k => refKeys.add(k));
                        });

                        promises.push(this._loadIntoWorkspace(new Query.ByIds({
                            entityType: nav.otherType,
                            expand: v.extracted.expansions.slice(),
                            ids: Array.from(keys)
                        })));
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
    private async _loadFromService(query: QueryType<any>): Promise<StringIndexable[]> {
        let executer = await this._getService(query.entityType);

        if (!executer) {
            throw `no service for entity type ${query.entityType.name} registered`;
        }

        let pending = this._pendingQueries.get(query.entityType);

        if (!pending) {
            pending = [];
            this._pendingQueries.set(query.entityType, pending);
        }

        let reduced = query;

        for (let i = 0; i < pending.length; ++i) {
            // todo: no idea why cast to Query<any> is necessary
            reduced = (pending[i].query as Query<any>).reduce(reduced);
            if (!reduced) return pending[i].promise;
        }

        let superset = pending.find(x => x.query.isSupersetOf(query));

        if (superset) {
            return superset.promise;
        }

        let throwNotSupported = (type: string) => {
            throw `query of type ${type} for entity ${query.entityType.name} not supported`;
        };

        let promise: Promise<StringIndexable[]> = null;

        switch (reduced.type) {
            case "all":
                if (!executer.loadAll) throwNotSupported("all");
                promise = executer.loadAll(reduced);
                break;

            case "id":
                if (!executer.loadOne) throwNotSupported("id");
                promise = Promise.all([executer.loadOne(reduced)]);
                break;

            case "ids":
                if (!executer.loadMany) throwNotSupported("ids");
                promise = executer.loadMany(reduced);
                break;

            case "indexes":
                if (!executer.loadByIndexes) throwNotSupported("indexes");
                promise = executer.loadByIndexes(reduced);
                break;

            default:
                throw `unknown query type ${(reduced as any).type}`;
        }

        pending.push({
            query: reduced,
            promise: promise
        });

        let cleanup = () => pending.splice(pending.findIndex(x => x.query == reduced), 1);
        promise.then(cleanup, cleanup);

        return promise.then(x => x.filter(y => y));
    }

    private async _getService<T extends IEntity>(entityType: EntityType<T>): Promise<IService> {
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
