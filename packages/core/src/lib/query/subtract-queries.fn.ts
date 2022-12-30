import { EntityQuery } from "./entity-query";
import { subtractQuery } from "./subtract-query.fn";

export function subtractQueries(queriesA: EntityQuery[], queriesB: EntityQuery[]): EntityQuery[] | false {
    if (!queriesA.length && !queriesB.length) {
        return [];
    }

    let totalSubtracted = queriesA.slice();
    let didSubtract = false;

    // for each query in B, pick each query in A and try to subtract it by B.
    // queries in A are updated with the subtracted results as we go.
    for (const queryB of queriesB) {
        const nextSubtracted: EntityQuery[] = [];

        for (const queryA of totalSubtracted) {
            const subtracted = subtractQuery(queryA, queryB);

            if (subtracted) {
                nextSubtracted.push(...subtracted);
                didSubtract = true;
            } else {
                nextSubtracted.push(queryA);
            }
        }

        totalSubtracted = nextSubtracted;
    }

    return didSubtract ? totalSubtracted : false;
}
