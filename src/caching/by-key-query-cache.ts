import { IStringable } from "../util";
import { IEntity } from "../metadata";
import { Query } from "../elements";

// todo: needs isolated testing
export class ByKeyQueryCache<T extends IEntity> {
    private _queriesPerKey = new Map<IStringable, Query.ByKey<T>>();

    isCached(query: Query.ByKey<T>): boolean {
        let cached = this._queriesPerKey.get(query.key);
        if (cached == null) return false;

        return cached.isSuperSetOf(query);
    }

    /**
     * Returns a query with already cached expansions removed or null if it is completely cached.
     */
    reduce(query: Query.ByKey<T>): Query.ByKey<T> {
        let existing = this._queriesPerKey.get(query.key);
        if (!existing) return query;

        return query.reduce(existing);
    }

    add(query: Query.ByKey<T>): void {
        if (this.isCached(query)) return;

        let existing = this._queriesPerKey.get(query.key);

        if (existing) {
            this._queriesPerKey.set(query.key, existing.merge(query));
        } else {
            this._queriesPerKey.set(query.key, query);
        }
    }
}
