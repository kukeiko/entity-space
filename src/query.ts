import { Criterion } from "./criteria";
import { Expansion, reduceExpansion } from "./expansion/public";

export interface Query {
    criteria: Criterion;
    expansion: Expansion;
}

export function reduceQuery(a: Query, b: Query): Query[] | false {
    const criteria = b.criteria === void 0 ? true : a.criteria === void 0 ? false : b.criteria.reduce(a.criteria);
    const expansion = reduceExpansion(a.expansion, b.expansion);

    if (!criteria || !expansion) {
        return false;
    } else if (criteria === true) {
        if (Object.keys(expansion).length == 0) {
            return [];
        }

        return [{ criteria: a.criteria, expansion }];
    } else if (Object.keys(expansion).length == 0) {
        return [{ criteria, expansion: a.expansion }];
    } else {
        return [
            { criteria, expansion: a.expansion },
            { criteria: b.criteria, expansion },
        ];
    }
}

export function reduceQueries(a: Query[], b: Query[]): Query[] | false {
    if (a.length === 0 && b.length === 0) {
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
