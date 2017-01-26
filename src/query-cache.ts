import { IEntityType } from "./metadata";
import { Query } from "./query";

export class QueryCache {
    private _byType = new Map<IEntityType<any>, Map<string, Query<any>>>();

    add(query: Query<any>): void {
        if (this.isCached(query)) return;

        let cached = this._getQueriesOfEntityType(query.entityType);
        cached.set(query.toString(), query);
    }

    isCached(query: Query<any>): boolean {
        let cached = this._getQueriesOfEntityType(query.entityType);

        return cached.has(query.toString())
            || Array.from(cached, x => x[1]).some(q => q.isSuperSetOf(query));
    }

    clear(args?: {
        entityType?: IEntityType<any>;
    }): void {
        args = args || {};

        if (args.entityType) {
            let cache = this._getQueriesOfEntityType(args.entityType);
            cache.clear();
        } else {
            this._byType = new Map<IEntityType<any>, Map<string, Query<any>>>()
        }
    }

    private _getQueriesOfEntityType(entityType: IEntityType<any>): Map<string, Query<any>> {
        let queries = this._byType.get(entityType);

        if (!queries) {
            queries = new Map<string, Query<any>>();
            this._byType.set(entityType, queries);
        }

        return queries;
    }
}
