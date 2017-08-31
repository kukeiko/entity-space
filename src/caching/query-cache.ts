import { TypeOf } from "../util";
import { getEntityMetadata, AnyEntityType, EntityType, IEntity, Navigation, EntityMetadata } from "../metadata";
import { Expansion, Query, ByIds, ByIndexes } from "../elements";

export class QueryCache {
    private _queries = new Map<AnyEntityType, Query<any>[]>();

    isCached<T>(query: Query<T>): boolean {
        return this.reduce(query) == null;
    }

    merge<T>(query: Query<T>, payload?: any[]): void {
        this._merge(query);

        if (payload) {
            this._buildQueriesFromPayload(getEntityMetadata(query.entityType), payload, query.expansions.slice());
        }
    }

    reduce<T>(query: Query<T>): Query<T> {
        let queries = this._getQueries(query.entityType);
        let reduced = query;

        for (let i = 0; i < queries.length; ++i) {
            reduced = queries[i].reduce(reduced);
            if (!reduced) break;
        }

        return reduced;
    }

    clear(entityType?: EntityType<any>): void {
        if (entityType) {
            this._queries.delete(entityType);
        } else {
            this._queries.clear();
        }
    }

    private _getQueries<T>(entityType: TypeOf<T>): Query<T>[] {
        let queries = this._queries.get(entityType);

        if (!queries) {
            queries = [];
            this._queries.set(entityType, queries);
        }

        return queries;
    }

    private _merge<T>(query: Query<T>): void {
        let queries = this._getQueries(query.entityType);
        let updated: Query<T>[] = [];

        for (let i = 0; i < queries.length; ++i) {
            let reduced = query.reduce(queries[i]);

            if (reduced) {
                updated.push(reduced);
            }
        }

        updated.push(query);
        this._queries.set(query.entityType, updated.sort((a, b) => a.identity.priority - b.identity.priority));
    }

    // todo: use for loops + make use of EntityMapper.collect() if possible (if not, make it happen),
    // since this function slows down loading from services quite a bit
    private _buildQueriesFromPayload(metadata: EntityMetadata<any>, entities: IEntity[], expansions: ArrayLike<Expansion>): void {
        if (entities.length == 0) return;

        let exp: Expansion;

        for (let i = 0; i < expansions.length; ++i) {
            exp = expansions[i];
            let nav = exp.property as Navigation;

            switch (nav.type) {
                case "ref":
                    {
                        let ref = nav;
                        let references: any[] = [];
                        let keys = new Set<any>();

                        entities.forEach(e => {
                            if (e[nav.dtoName] == null) return;

                            let key = e[metadata.getPrimitive(ref.keyName).dtoName];
                            if (keys.has(key)) return;

                            keys.add(key);
                            references.push(e);
                        });

                        let q = new Query({
                            identity: new ByIds(Array.from(keys)),
                            entityType: nav.otherType,
                            expand: exp.expansions,
                        });

                        this._merge(q);
                        this._buildQueriesFromPayload(nav.otherTypeMetadata, references, q.expansions);
                    }
                    break;

                // todo: array:child payload can be built into byindexes query (i think)
                case "array:child":
                    {
                        let metadata = getEntityMetadata(nav.otherType);
                        let keyName = metadata.primaryKey.dtoName;
                        let items: any[] = [];
                        let keys = new Set<any>();
                        let backRef = metadata.getBackReference(nav);
                        let backRefKeyName = metadata.getPrimitive(backRef.keyName).dtoName;

                        entities.forEach(e => {
                            let children = e[nav.dtoName] as any[];
                            if (!(children instanceof Array) || children.length == 0) return;

                            children.forEach(child => {
                                let key = child[keyName];
                                if (keys.has(key)) return;

                                keys.add(key);
                                items.push(child);
                            });

                            let byParentIdQuery = new Query({
                                identity: new ByIndexes({ [backRefKeyName]: children[0][backRefKeyName] }),
                                entityType: nav.otherType,
                                expand: exp.expansions
                            });

                            this._merge(byParentIdQuery);
                            this._buildQueriesFromPayload(nav.otherTypeMetadata, children, byParentIdQuery.expansions);
                        });

                        let q = new Query({
                            identity: new ByIds(Array.from(keys)),
                            entityType: nav.otherType,
                            expand: exp.expansions
                        });

                        this._merge(q);
                        this._buildQueriesFromPayload(nav.otherTypeMetadata, items, q.expansions);
                    }
                    break;

                case "array:ref":
                    {
                        let metadata = getEntityMetadata(nav.otherType);
                        let keyName = metadata.primaryKey.dtoName;
                        let items: any[] = [];
                        let keys = new Set<any>();

                        entities.forEach(e => {
                            if (!(e[nav.dtoName] instanceof Array)) return;

                            (e[nav.dtoName] as any[]).forEach(c => {
                                let key = c[keyName];
                                if (keys.has(key)) return;

                                keys.add(key);
                                items.push(c);
                            });
                        });

                        let q = new Query({
                            identity: new ByIds(Array.from(keys)),
                            entityType: nav.otherType,
                            expand: exp.expansions
                        });

                        this._merge(q);
                        this._buildQueriesFromPayload(nav.otherTypeMetadata, items, q.expansions);
                    }
                    break;
            }
        };
    }
}
