import { EntityQuery } from "./entity-query";
import { subtractQuery } from "./subtract-query.fn";

export function subtractQueries(what: readonly EntityQuery[], by: readonly EntityQuery[]): EntityQuery[] | boolean {
    if (!what.length && !by.length) {
        return true;
    }

    let totalSubtracted = what.slice();
    let didSubtract = false;

    // for each query in B, pick each query in A and try to subtract it by B.
    // queries in A are updated with the subtracted results as we go.
    for (const queryB of by) {
        const nextSubtracted: EntityQuery[] = [];

        for (const queryA of totalSubtracted) {
            const subtracted = subtractQuery(queryA, queryB);

            if (subtracted === false) {
                nextSubtracted.push(queryA);
            } else if (subtracted === true) {
                didSubtract = true;
            } else {
                nextSubtracted.push(...subtracted);
                didSubtract = true;
            }
        }

        totalSubtracted = nextSubtracted;
    }

    if (!didSubtract) {
        return false;
    }

    return totalSubtracted.length ? totalSubtracted : true;
}
