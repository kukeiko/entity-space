import { getEntityMetadata, IEntityType, IEntity, Children, NavigationType } from "./metadata";
import { Expansion, Path, Query, QueryType } from "./elements";
import { QueryCache, Workspace } from "./caching";
import { IQueryExecuter } from "./query-executer";

export class ServiceCluster {
    private _executers = new Map<IEntityType<any>, IQueryExecuter<any>>();
    private _queryCache = new QueryCache();
    private _workspace: Workspace;

    constructor(workspace: Workspace) {
        this._workspace = workspace;
    }

    flush(args?: {
        entityType?: IEntityType<any>;
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

    register<T>(entityType: IEntityType<T>, executer: IQueryExecuter<T>): void {
        this._executers.set(entityType, executer);
    }

    async save<T extends IEntity>(args: {
        entity: T;
    }): Promise<T> {
        let entityType = args.entity.constructor as IEntityType<any>;
        let metadata = getEntityMetadata(entityType);
        let executer = this._executers.get(entityType) as IQueryExecuter<any>;

        if (!executer) {
            throw `no query executer for entity type ${entityType.name} registered`;
        }

        let key = args.entity[metadata.primaryKey.name];
        let diff: { [key: string]: any } = null;

        if (key != null) {
            diff = {};

            let cached = (await this.execute(new Query.ByKey({
                entityType: entityType,
                key: key
            }))).get(key);

            metadata.primitives.forEach(p => {
                if (!_.isEqual(args.entity[p.name], cached[p.name])) {
                    diff[p.name] = args.entity[p.name];
                }
            });

            if (Object.keys(diff).length == 0) {
                return args.entity;
            }
        }

        let saved = await executer.save(args.entity, diff || null);

        this._workspace.add({
            entity: saved,
            type: entityType
        });

        key = saved[getEntityMetadata(entityType).primaryKey.name];

        return (await this.execute(new Query.ByKey({
            entityType: entityType,
            key: key
        }))).get(key) || null;
    }

    async delete(args: {
        entity: IEntity;
    }): Promise<void> {
        let entityType = args.entity.constructor as IEntityType<any>;
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
        let [noVirtuals, virtuals] = query.extract(exp => exp.property.virtual);

        if (!this._queryCache.isCached(noVirtuals)) {
            let fromService: any[] = await this._loadFromService(noVirtuals);

            this._workspace.addMany({
                entities: fromService,
                type: noVirtuals.entityType,
                expansion: noVirtuals.expansions
            });

            this._queryCache.add(noVirtuals);

            let fromCache = this._workspace.execute(noVirtuals);
            this._buildQueriesFromPayload(Array.from(fromCache.values()), noVirtuals.expansions.slice());
        }

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
                        let backRef = getEntityMetadata(nav.otherType).getReference(nav.backReferenceName);
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
        let executer = this._executers.get(query.entityType) as IQueryExecuter<T>;

        if (!executer) {
            throw `no query executer for entity type ${query.entityType.name} registered`;
        }

        let throwNotSupported = (type: string) => {
            throw `query of type ${type} for entity ${query.entityType.name} not supported`;
        };

        switch (query.type) {
            case "all":
                if (!executer.loadAll) throwNotSupported("All");
                return await executer.loadAll(query);

            case "key":
                if (!executer.loadOne) throwNotSupported("ByKey");
                return [await executer.loadOne(query)];

            case "keys":
                if (!executer.loadMany) throwNotSupported("ByKeys");
                return await executer.loadMany(query);

            case "indexes":
                if (!executer.loadByIndexes) throwNotSupported("ByIndexes");
                return await executer.loadByIndexes(query);

            default:
                throw `unknown query type ${(query as any).type}`;
        }
    }

    private _buildQueriesFromPayload(entities: any[], expansions: Expansion[]): void {
        expansions.forEach(exp => {
            let nav = exp.property as NavigationType;

            switch (nav.type) {
                case "ref":
                    {
                        let ref = nav;
                        let references: any[] = [];
                        let keys = new Set<any>();

                        entities.forEach(e => {
                            if (e[nav.name] == null) return;

                            let key = e[ref.keyName];
                            if (keys.has(key)) return;

                            keys.add(key);
                            references.push(e);
                        });

                        let q = new Query.ByKeys({
                            entityType: nav.otherType,
                            expansions: exp.expansions.slice(),
                            keys: Array.from(keys)
                        });

                        this._queryCache.add(q);
                        this._buildQueriesFromPayload(references, exp.expansions.slice());
                    }
                    break;

                case "array:child":
                case "array:ref":
                    {
                        let metadata = getEntityMetadata(nav.otherType);
                        let keyName = metadata.primaryKey.name;
                        let items: any[] = [];
                        let keys = new Set<any>();

                        entities.forEach(e => {
                            if (!(e[nav.name] instanceof Array)) return;

                            (e[nav.name] as any[]).forEach(c => {
                                let key = c[keyName];
                                if (keys.has(key)) return;

                                keys.add(key);
                                items.push(c);
                            });
                        });

                        let q = new Query.ByKeys({
                            entityType: nav.otherType,
                            expansions: exp.expansions.slice(),
                            keys: Array.from(keys)
                        });

                        this._queryCache.add(q);
                        this._buildQueriesFromPayload(items, exp.expansions.slice());
                    }
                    break;
            }
        });
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
