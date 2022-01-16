import { mergeQuery } from "./merge-query.fn";
import { Query } from "./query";

export function mergeQueries(...queries: Query[]): Query[] {
    let merged: Query[] = [];

    for (const query of queries) {
        let nextMerged: Query[] = [];

        if (nextMerged.length === 0) {
            nextMerged = [query];
            merged = nextMerged;
            continue;
        }

        for (const mergedQuery of merged) {
            const mergedResult = mergeQuery(query, mergedQuery);

            if (mergedResult !== false) {
                nextMerged.push(...mergedResult);
            } else {
                nextMerged.push(query);
            }
        }

        merged = nextMerged;
    }

    return merged;
}
