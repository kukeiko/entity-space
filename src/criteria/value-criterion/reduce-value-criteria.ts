import { ValueCriteria } from "./value-criteria";
import { reduceValueCriterion } from "./reduce-value-criterion";

// [todo] create specific test cases for this function
export function reduceValueCriteria(a: ValueCriteria, b: ValueCriteria): ValueCriteria | false {
    if (a.length === 0 && b.length === 0) {
        return [];
    }

    let reduced = a.slice();
    let didReduceAny = false;

    // for each criterion in B, pick each criterion in A and try to reduce it.
    // criteria in A are updated with the reduced results as we go.
    for (const criterionB of b) {
        const nextReduced: ValueCriteria = [];

        for (const criterionA of reduced) {
            const reducedCriteria = reduceValueCriterion(criterionA, criterionB);

            if (reducedCriteria) {
                nextReduced.push(...reducedCriteria);
                didReduceAny = true;
            } else {
                nextReduced.push(criterionA);
            }
        }

        reduced = nextReduced;
    }

    return didReduceAny ? reduced : false;
}
