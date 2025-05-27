import { EntityQuery } from "./entity-query";
import { mergeQuery } from "./merge-query.fn";

export function mergeQueries(queries: readonly EntityQuery[]): EntityQuery[] | false {
    if (!queries.length) {
        return false;
    }

    let merged: EntityQuery[] = queries.slice();
    let nextMerged: EntityQuery[] = [];
    let didOverallMerge = false;

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
                didOverallMerge = true;
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

    if (!didOverallMerge) {
        return false;
    }

    return merged;
}
