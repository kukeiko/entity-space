import { EntityCriteriaFactory } from "../criteria/vnext/entity-criteria-factory";
import { EntityQueryFactory } from "./entity-query-factory";
import { IEntityQuery } from "./entity-query.interface";
import { subtractQuery } from "./subtract-query.fn";

export function subtractQueries(queriesA: IEntityQuery[], queriesB: IEntityQuery[]): IEntityQuery[] | false {
    if (!queriesA.length && !queriesB.length) {
        return [];
    }

    // [todo] hardcoded
    const factory = new EntityQueryFactory({ criteriaFactory: new EntityCriteriaFactory() });

    let totalSubtracted = queriesA.slice();
    let didSubtract = false;

    // for each query in B, pick each query in A and try to subtract it by B.
    // queries in A are updated with the subtracted results as we go.
    for (const queryB of queriesB) {
        const nextSubtracted: IEntityQuery[] = [];

        for (const queryA of totalSubtracted) {
            const subtracted = subtractQuery(factory, queryA, queryB);

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
