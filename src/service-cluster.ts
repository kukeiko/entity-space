import * as _ from "lodash";
import { getEntityMetadata, IEntityClass, IEntity, Children, NavigationType } from "./metadata";
import { Path, Query, QueryType } from "./elements";
import { QueryCache, Workspace } from "./caching";
import { IQueryExecuter } from "./query-executer";
import { EntityMapper } from "./entity-mapper";

export class ServiceCluster {
    private _executers = new Map<IEntityClass<any>, IQueryExecuter<any>>();
    private _queryCache = new QueryCache();
    private _workspace: Workspace;
    private _pendingQueries = new Map<IEntityClass<any>, { query: QueryType<any>, promise: Promise<any> }[]>();

    constructor(workspace: Workspace) {
        this._workspace = workspace;
    }

    flush(args?: {
        entityType?: IEntityClass<any>;
    }): void {
        args = args || {};

        if (args.entityType) {
            this._workspace.clear({
                entityType: args.entityType
            });

            this._queryCache.clear({
                entityType: args.entityType
            });
        } else {
            this._workspace.clear();
            this._queryCache.clear();
        }
    }

    register<T>(entityType: IEntityClass<T>, executer: IQueryExecuter<T>): void {
        this._executers.set(entityType, executer);
    }

    async save<T extends IEntity>(args: {
        entity: T;
    }): Promise<T> {
        let mapper = new EntityMapper();
        let entityType = args.entity.constructor as IEntityClass<any>;
        let metadata = getEntityMetadata(entityType);
        let executer = this._executers.get(entityType) as IQueryExecuter<any>;
        let toDto = true; // todo: make configurable

        if (!executer) {
            throw `no query executer for entity type ${entityType.name} registered`;
        }

        let key = args.entity[metadata.primaryKey.name];

        // todo: make configurable
        mapper.updateReferenceKeys({
            item: args.entity,
            metadata: metadata
        });

        let saveable = mapper.createSaveable({
            from: args.entity,
            metadata: metadata,
            toDto: toDto
        });

        let diff: { [key: string]: any } = null;

        if (key != null) {
            diff = {};

            let cached = (await this.execute(new Query.ByKey({
                entityType: entityType,
                key: key
            }))).get(key);

            let cachedSaveable = mapper.createSaveable({
                from: cached,
                metadata: metadata,
                toDto: toDto
            });

            metadata.primitives.forEach(p => {
                if (!p.saveable) return;
                let propName = p.getName(toDto);

                if (!_.isEqual(saveable[propName], cachedSaveable[propName])) {
                    diff[propName] = saveable[propName];
                }
            });

            if (Object.keys(diff).length == 0) {
                return args.entity;
            }
        }

        let saved = await executer.save(args.entity, saveable, diff || null);

        this._workspace.add({
            entity: saved,
            type: entityType
        });

        key = saved[metadata.primaryKey.name];

        return (await this.execute(new Query.ByKey({
            entityType: entityType,
            key: key
        }))).get(key) || null;
    }

    async delete(args: {
        entity: IEntity;
    }): Promise<void> {
        let entityType = args.entity.constructor as IEntityClass<any>;
        let executer = this._executers.get(entityType) as IQueryExecuter<any>;

        if (!executer) {
            throw `no query executer for entity type ${entityType.name} registered`;
        }

        await executer.delete(args.entity);

        this._workspace.remove({
            item: args.entity,
            type: entityType
        });
    }

    async execute<T extends IEntity>(query: QueryType<T>): Promise<Map<any, T>> {
        await this._loadIntoWorkspace(query);

        return await this._workspace.execute(query);
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
                    this._workspace.addMany({
                        entities: entities,
                        type: rq.entityType,
                        expansion: rq.expansions
                    });

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

                        promises.push(this._loadIntoWorkspace(new Query.ByKeys({
                            entityType: nav.otherType,
                            expansions: v.extracted.expansions.slice(),
                            keys: Array.from(keys)
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
                                expansions: v.extracted.expansions.slice(),
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

                        promises.push(this._loadIntoWorkspace(new Query.ByKeys({
                            entityType: nav.otherType,
                            expansions: v.extracted.expansions.slice(),
                            keys: Array.from(keys)
                        })));
                        break;
                }
            });

            await Promise.all(promises);
        }
    }

    /**
     * Load entities from a service by looking up the query executer associated with the entity type of the query.
     *
     * The query must not contain any virtuals.
     */
    private async _loadFromService<T>(query: QueryType<T>): Promise<T[]> {
        let pending = this._pendingQueries.get(query.entityType);

        if (!pending) {
            pending = [];
            this._pendingQueries.set(query.entityType, pending);
        }

        let superset = pending.find(x => x.query.isSupersetOf(query));

        if (superset) {
            return superset.promise;
        }

        let executer = this._executers.get(query.entityType) as IQueryExecuter<T>;

        if (!executer) {
            throw `no query executer for entity type ${query.entityType.name} registered`;
        }

        let throwNotSupported = (type: string) => {
            throw `query of type ${type} for entity ${query.entityType.name} not supported`;
        };

        let promise: Promise<T[]> = null;

        switch (query.type) {
            case "all":
                if (!executer.loadAll) throwNotSupported("All");
                promise = executer.loadAll(query);
                break;

            case "key":
                if (!executer.loadOne) throwNotSupported("ByKey");
                promise = Promise.all([executer.loadOne(query)]);
                break;

            case "keys":
                if (!executer.loadMany) throwNotSupported("ByKeys");
                promise = executer.loadMany(query);
                break;

            case "indexes":
                if (!executer.loadByIndexes) throwNotSupported("ByIndexes");
                promise = executer.loadByIndexes(query);
                break;

            default:
                throw `unknown query type ${(query as any).type}`;
        }

        pending.push({
            query: query,
            promise: promise
        });

        promise.then(() => pending.splice(pending.findIndex(x => x.query == query), 1));

        return promise;
    }

    private _crawl(entities: Map<any, any>, path: Path): any[] {
        let items = Array.from(entities.values());

        let next = path;

        while (next) {
            let isArray = next.property instanceof Children;

            if (isArray) {
                items = _.flatten(items.map(item => item[next.property.name]));
            } else {
                items = items.map(item => item[next.property.name]);
            }

            next = next.next;
        }

        return items;
    }
}
