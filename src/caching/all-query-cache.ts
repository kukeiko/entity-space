import { IEntity } from "../metadata";
import { Query, QueryType } from "../elements";

// todo: needs isolated testing
export class AllQueryCache<T extends IEntity> {
    private _cached: Query.All<T> = null;

    isCached(query: QueryType<T>): boolean {
        return this._cached
            ? this._cached.isSupersetOf(query)
            : false;
    }

    /**
     * Returns a query with already cached expansions removed or null if it is completely cached.
     */
    reduce(query: QueryType<T>): QueryType<T> {
        if (!this._cached) return query;

        return this._cached.reduce(query);
    }

    merge(query: Query.All<T>): void {
        if (!this._cached) {
            this._cached = query;
        } else {
            this._cached = this._cached.merge(query);
        }
    }
}