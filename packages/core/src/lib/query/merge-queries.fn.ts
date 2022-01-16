import { mergeQuery } from "./merge-query.fn";
import { Query } from "./query";

export function mergeQueries(...queries: Query[]): Query[] {
    const [first, ...others] = [...queries];

    if (first === void 0) {
        return [];
    }

    let merged: Query[] = [first];

    for (const query of others) {
        let nextMerged: Query[] = [];

        for (const mergedQuery of merged) {
            const mergedResult = mergeQuery(mergedQuery, query);

            if (mergedResult !== false) {
                nextMerged.push(...mergedResult);
            } else {
                nextMerged.push(mergedQuery, query);
            }
        }

        merged = nextMerged;
    }

    return merged;
}
