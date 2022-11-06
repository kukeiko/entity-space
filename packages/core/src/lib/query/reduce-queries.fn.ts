import { EntityQuery } from "./entity-query";
import { subtractQuery } from "./reduce-query.fn";

export function subtractQueries(a: EntityQuery[], b: EntityQuery[]): EntityQuery[] | false {
    if (!a.length && !b.length) {
        return [];
    }

    let reduced = a.slice();
    let didReduceAny = false;

    // for each query in B, pick each query in A and try to reduce it by B.
    // queries in A are updated with the reduced results as we go.
    for (const queryB of b) {
        const nextReduced: EntityQuery[] = [];

        for (const queryA of reduced) {
            const reducedQueries = subtractQuery(queryA, queryB);

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
