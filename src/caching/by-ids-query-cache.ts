import { ToStringable } from "../util";
import { IEntity } from "../metadata";
import { Query } from "../elements";

// todo: needs isolated testing
export class ByIdsQueryKeyCache<T extends IEntity> {
    private _queriesPerId = new Map<ToStringable, Query.ById<T>>();

    isCached(query: Query.ById<T>): boolean;
    isCached(query: Query.ByIds<T>): boolean;
    isCached(...args: any[]): any {
        let query = args[0] as Query.ById<T> | Query.ByIds<T>;

        if (query.type == "id") {
            let cached = this._queriesPerId.get(query.id);
            if (cached == null) return false;

            return cached.isSupersetOf(query);
        } else if (query.type == "ids") {
            return query.ids.every(k => this.isCached(new Query.ById({
                entityType: query.entityType,
                expand: query.expansions.slice(),
                id: k
            })));
        } else {
            throw `incompatible query: ${query}`;
        }
    }

    /**
     * Returns a query with already cached expansions removed or null if it is completely cached.
     */
    reduce(query: Query.ById<T>): Query.ById<T>;
    reduce(query: Query.ByIds<T>): Array<Query.ById<T> | Query.ByIds<T>>;
    reduce(...args: any[]): any {
        let query = args[0] as Query.ById<T> | Query.ByIds<T>;

        if (query.type == "id") {
            let existing = this._queriesPerId.get(query.id);
            if (!existing) return query;

            return existing.reduce(query);
        } else {
            let reduced = query.ids.map(k => new Query.ById({
                entityType: query.entityType,
                expand: query.expansions.slice(),
                id: k
            })).map(q => this.reduce(q)).filter(q => q);

            let byExpansion = new Map<string, Query.ById<T>[]>();

            reduced.forEach(q => {
                let ofExpansion = byExpansion.get(q.expansion);

                if (ofExpansion == null) {
                    ofExpansion = [];
                    byExpansion.set(q.expansion, ofExpansion);
                }

                ofExpansion.push(q);
            });

            let result: Array<Query.ById<T> | Query.ByIds<T>> = [];

            byExpansion.forEach(queries => {
                if (queries.length == 1) {
                    result.push(queries[0]);
                } else {
                    let q = queries[0];

                    result.push(new Query.ByIds({
                        entityType: q.entityType,
                        expand: q.expansions.slice(),
                        ids: queries.map(q => q.id)
                    }));
                }
            });

            return result;
        }
    }

    merge(query: Query.ById<T> | Query.ByIds<T>): void {
        if (query.type == "id") {
            let existing = this._queriesPerId.get(query.id);

            if (existing) {
                this._queriesPerId.set(query.id, existing.merge(query));
            } else {
                this._queriesPerId.set(query.id, query);
            }
        } else if (query.type == "ids") {
            query.ids.forEach(k => {
                this.merge(new Query.ById({
                    entityType: query.entityType,
                    expand: query.expansions.slice(),
                    id: k
                }));
            });
        } else {
            throw `incompatible query: ${query}`;
        }
    }
}
