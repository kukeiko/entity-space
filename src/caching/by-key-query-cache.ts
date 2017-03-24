import { IStringable } from "../util";
import { IEntity } from "../metadata";
import { Query } from "../elements";

// todo: needs isolated testing
export class ByKeyQueryCache<T extends IEntity> {
    private _queriesPerKey = new Map<IStringable, Query.ByKey<T>>();

    isCached(query: Query.ByKey<T>): boolean;
    isCached(query: Query.ByKeys<T>): boolean;
    isCached(...args: any[]): any {
        let query = args[0] as Query.ByKey<T> | Query.ByKeys<T>;

        if (query.type == "key") {
            let cached = this._queriesPerKey.get(query.key);
            if (cached == null) return false;

            return cached.isSuperSetOf(query);
        } else if (query.type == "keys") {
            return query.keys.every(k => this.isCached(new Query.ByKey({
                entityType: query.entityType,
                expansions: query.expansions.slice(),
                key: k
            })));
        } else {
            throw `incompatible query: ${query}`;
        }
    }

    /**
     * Returns a query with already cached expansions removed or null if it is completely cached.
     */
    reduce(query: Query.ByKey<T>): Query.ByKey<T>;
    reduce(query: Query.ByKeys<T>): Array<Query.ByKey<T> | Query.ByKeys<T>>;
    reduce(...args: any[]): any {
        let query = args[0] as Query.ByKey<T> | Query.ByKeys<T>;

        if (query.type == "key") {
            let existing = this._queriesPerKey.get(query.key);
            if (!existing) return query;

            return existing.reduce(query);
        } else {
            let reduced = query.keys.map(k => new Query.ByKey({
                entityType: query.entityType,
                expansions: query.expansions.slice(),
                key: k
            })).map(q => this.reduce(q)).filter(q => q);

            let byExpansion = new Map<string, Query.ByKey<T>[]>();

            reduced.forEach(q => {
                let ofExpansion = byExpansion.get(q.expansion);

                if (ofExpansion == null) {
                    ofExpansion = [];
                    byExpansion.set(q.expansion, ofExpansion);
                }

                ofExpansion.push(q);
            });

            let result: Array<Query.ByKey<T> | Query.ByKeys<T>> = [];

            byExpansion.forEach(queries => {
                if (queries.length == 1) {
                    result.push(queries[0]);
                } else {
                    let q = queries[0];

                    result.push(new Query.ByKeys({
                        entityType: q.entityType,
                        expansions: q.expansions.slice(),
                        keys: queries.map(q => q.key)
                    }));
                }
            });

            return result;
        }
    }

    add(query: Query.ByKey<T> | Query.ByKeys<T>): void {
        if (query.type == "key") {
            let existing = this._queriesPerKey.get(query.key);

            if (existing) {
                this._queriesPerKey.set(query.key, existing.merge(query));
            } else {
                this._queriesPerKey.set(query.key, query);
            }
        } else if (query.type == "keys") {
            query.keys.forEach(k => {
                this.add(new Query.ByKey({
                    entityType: query.entityType,
                    expansions: query.expansions.slice(),
                    key: k
                }));
            });
        } else {
            throw `incompatible query: ${query}`;
        }
    }
}
