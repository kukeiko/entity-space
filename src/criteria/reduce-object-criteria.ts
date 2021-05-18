import { ObjectCriteria } from "./object-criteria";
import { reduceObjectCriterion } from "./reduce-object-criterion";

export function reduceObjectCriteria(a: ObjectCriteria, b: ObjectCriteria): ObjectCriteria | false {
    if (a.length === 0 && b.length === 0) {
        return [];
    }

    let reduced = a.slice();
    let didReduceAny = false;

    // for each criterion in B, pick each criterion in A and try to reduce it.
    // criteria in A are updated with the reduced results as we go.
    for (const criterionB of b) {
        const nextReduced: ObjectCriteria = [];

        for (const criterionA of reduced) {
            const reducedCriteria = reduceObjectCriterion(criterionA, criterionB);

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
