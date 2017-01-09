import { getEntityMetadata, IEntityType, Collection, Reference } from "./metadata";
import { Extraction } from "./extraction";
import { Path } from "./path";
import { Query } from "./query";
import { QueryCache } from "./query-cache";
import { IQueryExecuter } from "./query-executer";
import { Workspace } from "./workspace";

export class ServiceCluster {
    private _executers = new Map<IEntityType<any>, IQueryExecuter<any>>();
    private _queryCache = new QueryCache();
    private _workspace: Workspace;

    constructor(workspace: Workspace) {
        this._workspace = workspace;
    }

    register<T>(executer: IQueryExecuter<T>): void {
        this._executers.set(executer.entityType, executer);
    }

    async execute<T>(query: Query<T>): Promise<Map<any, T>> {
        let executer = this._executers.get(query.entityType) as IQueryExecuter<T>;

        if (!executer) {
            throw `no query executer for entity type ${query.entityType.name} registered`;
        }

        let [noVirtuals, virtuals] = query.extract(exp => exp.property.virtual);

        let entities = await this._execute(noVirtuals);

        await Promise.all<any>(virtuals.map(v => this._hydrateEntities(entities, v)));

        return await this._execute(query);
    }

    private _hydrateEntities<T>(entities: Map<any, T>, ex: Extraction): Promise<void> {
        let dryEntities = this._crawl(entities, ex.path);

        if (ex.extracted.property instanceof Reference) {
            let refName = ex.extracted.property.name;
            let keyName = ex.extracted.property.keyName;
            let keys = new Set<any>();

            dryEntities.forEach(t => keys.add(t[keyName]));

            return this.execute(new Query.ByKeys({
                entityType: ex.extracted.property.otherType,
                expansions: ex.extracted.expansions.slice(),
                keys: Array.from(keys)
            })).then(items => {
                dryEntities.forEach(t => t[refName] = items.get(t[keyName]) || null);
            });
        } else if (ex.extracted.property instanceof Collection) {
            let otherMetadata = getEntityMetadata(ex.extracted.property.otherType);
            let backRef = otherMetadata.getReference(ex.extracted.property.backReferenceName);
            let metadata = getEntityMetadata(backRef.otherType);
            let pkName = metadata.primaryKey.name;

            return Promise.all(dryEntities.map(t => {
                return this.execute(new Query.ByIndex({
                    entityType: ex.extracted.property.otherType,
                    expansions: ex.extracted.expansions.slice(),
                    index: backRef.keyName,
                    value: t[pkName]
                })).then(items => {
                    t[ex.extracted.property.name] = Array.from(items, x => x[1]);
                });
            })).then(() => void 0);
        }
    }

    private async _execute<T>(query: Query<T>): Promise<Map<any, T>> {
        if (!this._queryCache.isCached(query)) {
            let entities: T[] = await this._executeAgainstService(query);

            this._workspace.addMany({
                entities: entities,
                type: query.entityType,
                expansion: query.expansions
            });

            this._queryCache.add(query);
        }

        return this._workspace.execute(query);
    }

    private async _executeAgainstService<T>(query: Query<T>): Promise<T[]> {
        let executer = this._executers.get(query.entityType) as IQueryExecuter<T>;

        let throwNotSupported = (type: string) => {
            throw `query of type ${type} for entity ${query.entityType.name} not supported`;
        };

        if (query instanceof Query.ByIndex) {
            if (!executer.loadByIndex) throwNotSupported("ByIndex");

            return await executer.loadByIndex(query);
        } else if (query instanceof Query.ByIndexes) {
            if (!executer.loadByIndexes) throwNotSupported("ByIndexes");

            return await executer.loadByIndexes(query);
        } else if (query instanceof Query.ByKey) {
            if (!executer.loadOne) throwNotSupported("ByKey");

            return [await executer.loadOne(query)];
        } else if (query instanceof Query.ByKeys) {
            if (!executer.loadMany) throwNotSupported("ByKeys");

            return await executer.loadMany(query);
        } else if (query instanceof Query.All) {
            if (!executer.loadAll) throwNotSupported("All");

            return await executer.loadAll(query);
        }
    }

    private _crawl(entities: Map<any, any>, path: Path): any[] {
        let items = Array.from(entities.values());

        let next = path;

        while (next) {
            let isArray = next.property instanceof Collection;

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
