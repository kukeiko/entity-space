import { mergeQuery } from "./merge-query.fn";
import { Query } from "./query";

export function mergeQueries_v2(...queries: Query[]): Query[] {
    if (!queries.length) {
        return [];
    }

    let merged: Query[] = queries.slice();
    let nextMerged: Query[] = [];

    for (let i = 0; i < merged.length; ++i) {
        let query = merged[i];
        let didMerge = false;

        for (let e = 0; e < merged.length; ++e) {
            if (e == i) {
                continue;
            }

            const other = merged[e];
            const result = mergeQuery(query, other);

            if (result) {
                nextMerged.push(result);
                didMerge = true;
                query = result;
            } else {
                nextMerged.push(other);
            }
        }

        if (didMerge) {
            i = 0;
        } else {
            nextMerged.unshift(query);
        }

        merged = nextMerged.slice();
        nextMerged = [];
    }

    return merged;
}