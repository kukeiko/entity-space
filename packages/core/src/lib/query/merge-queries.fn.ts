import { mergeQuery } from "./merge-query.fn";
import { EntityQuery } from "./query";

export function mergeQueries(...queries: EntityQuery[]): EntityQuery[] {
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
