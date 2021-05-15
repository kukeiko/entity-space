import { ValueCriteria } from "./value-criteria";
import { reduceValueCriterion } from "./reduce-value-criterion";

export function reduceValueCriteria(a: ValueCriteria, b: ValueCriteria): ValueCriteria | null {
    if (a.length === 0 && b.length === 0) {
        return null;
    }

    let reduced = a.slice();
    let didReduce = false;

    for (let criterionB of b) {
        const nextReduced: ValueCriteria = [];

        for (let criterionA of reduced) {
            let reducedCriteria = reduceValueCriterion(criterionA, criterionB);
            nextReduced.push(...reducedCriteria);

            // [todo] consider not using an extra check-flag, instead, check at and of function
            if (reducedCriteria[0] !== criterionA && !didReduce) {
                didReduce = true;
            }
        }

        reduced = nextReduced;
    }

    if (didReduce) {
        return reduced.length > 0 ? reduced : null;
    } else {
        return a;
    }
}
