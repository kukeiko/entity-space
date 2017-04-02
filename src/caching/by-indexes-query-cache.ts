import { combinations } from "../util";
import { IEntity } from "../metadata";
import { Query } from "../elements";

// todo: needs isolated testing
export class ByIndexesQueryCache<T extends IEntity> {
    private _queryPerIndexesString = new Map<string, Query.ByIndexes<T>>();

    isCached(query: Query.ByIndexes<T>): boolean {
        return this._getIdentitySupersets(query).some(q => q.isSupersetOf(query));
    }

    /**
     * todo: determining best candidate purely on number of expansions is naive,
     * since 1:n expansions are more expensive than n:1 expansions
     */
    reduce(query: Query.ByIndexes<T>): Query.ByIndexes<T> {
        let candidates = this._getIdentitySupersets(query).map(x => x.reduce(query));
        let numMinExpansions = null;
        let best: Query.ByIndexes<T> = query;

        for (let i = 0; i < candidates.length; ++i) {
            let candidate = candidates[i];

            // it doesn't get better than a fully reduced query
            if (candidate == null) return candidate;

            if (numMinExpansions == null || candidate.numExpansions < numMinExpansions) {
                numMinExpansions = candidate.numExpansions;
                best = candidate;
            }
        }

        return best;
    }

    merge(query: Query.ByIndexes<T>): void {
        let indexesKey = query.indexesToArray().toString();
        let existing = this._queryPerIndexesString.get(indexesKey);

        if (!existing) {
            this._queryPerIndexesString.set(indexesKey, query);
        } else {
            this._queryPerIndexesString.set(indexesKey, existing.merge(query));
        }
    }

    private _getIdentitySupersets(query: Query.ByIndexes<T>): Query.ByIndexes<T>[] {
        let sets = combinations(query.indexesToArray());

        return sets.map(s => this._queryPerIndexesString.get(s.toString())).filter(q => q);
    }
}
