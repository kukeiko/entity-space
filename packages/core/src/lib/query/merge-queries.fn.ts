import { mergeQuery } from "./merge-query.fn";
import { Query } from "./query";

export function mergeQueries(...queries: Query[]): Query[] {
    const [first, ...others] = [...queries];

    if (first === void 0) {
        return [];
    }

    let didMerge = false;
    let merged = others.map(other => {
        const result = mergeQuery(first, other);

        if (result !== false) {
            didMerge = true;
            return result;
        } else {
            return other;
        }
    });

    if (didMerge) {
        return mergeQueries(...merged);
    }

    return queries;
}
