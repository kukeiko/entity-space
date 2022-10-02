import { Query } from "./query";
import { reduceQuery } from "./reduce-query.fn";

export function reduceQueries(a: Query[], b: Query[]): Query[] | false {
    if (!a.length && !b.length) {
        return [];
    }

    let reduced = a.slice();
    let didReduceAny = false;

    // for each query in B, pick each query in A and try to reduce it by B.
    // queries in A are updated with the reduced results as we go.
    for (const queryB of b) {
        const nextReduced: Query[] = [];

        for (const queryA of reduced) {
            const reducedQueries = reduceQuery(queryA, queryB);

            if (reducedQueries) {
                nextReduced.push(...reducedQueries);
                didReduceAny = true;
            } else {
                nextReduced.push(queryA);
            }
        }

        reduced = nextReduced;
    }

    return didReduceAny ? reduced : false;
}

export function reduceQueries_v2(a: Query[], b: Query[]): Query[] | false {
    if (a.length === 0 || b.length === 0) {
        return false;
    }

    let reduced = a.slice();
    let didReduceAny = false;

    // for each query in B, pick each query in A and try to reduce it by B.
    // queries in A are updated with the reduced results as we go.
    for (const queryB of b) {
        const nextReduced: Query[] = [];

        for (const queryA of reduced) {
            const reducedQueries = reduceQuery(queryA, queryB);

            if (reducedQueries) {
                nextReduced.push(...reducedQueries);
                didReduceAny = true;
            } else {
                nextReduced.push(queryA);
            }
        }

        reduced = nextReduced;
    }

    return didReduceAny ? reduced : false;
}
