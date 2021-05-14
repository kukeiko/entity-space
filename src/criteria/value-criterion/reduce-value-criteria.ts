import { ValueCriteria } from "./value-criteria";
import { reduceValueCriterion } from "./reduce-value-criterion";

export function reduceValueCriteria(a: ValueCriteria, b: ValueCriteria): ValueCriteria | null {
    let reduced = a.slice();
    let didReduce = false;

    for (let criterionB of b) {
        const nextReduced: ValueCriteria = [];

        for (let criterionA of reduced) {
            let reducedCriterion = reduceValueCriterion(criterionA, criterionB);
            nextReduced.push(...reducedCriterion);

            // [todo] consider not using an extra check-flag, instead, check at and of function
            if (reducedCriterion[0] !== criterionA && !didReduce) {
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
