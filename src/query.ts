import { Expansion } from "./expansion";
import { Criterion } from "./criteria";
import { reduceExpansion } from ".";

export interface Query {
    criteria: Criterion;
    expansion: Expansion;
}

export function reduceQuery(a: Query, b: Query): Query[] | false {
    let reducedCriteria = b.criteria === void 0 ? true : a.criteria === void 0 ? false : b.criteria.reduce(a.criteria);
    const reducedSelection = reduceExpansion(a.expansion, b.expansion);

    if (!reducedCriteria || !reducedSelection) {
        return false;
    } else if (reducedCriteria === true) {
        if (Object.keys(reducedSelection).length == 0) {
            return [];
        }

        return [
            {
                criteria: a.criteria,
                expansion: reducedSelection,
            },
        ];
    } else if (Object.keys(reducedSelection).length == 0) {
        return [
            {
                criteria: reducedCriteria,
                expansion: a.expansion,
            },
        ];
    } else {
        return [
            {
                criteria: reducedCriteria,
                expansion: a.expansion,
            },
            {
                criteria: b.criteria,
                expansion: reducedSelection,
            },
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
