import { ValueCriteria } from "./value-criteria";
import { reduceValueCriterion } from "./reduce-value-criterion";

export function reduceValueCriteria(a: ValueCriteria, b: ValueCriteria): ValueCriteria | null {
    let reduced = a.slice();
    let didReduce = false;

    for (let criterionB of b) {
        let nextReduced: ValueCriteria = [];

        for (let criterionA of reduced) {
            let reducedCriterion = reduceValueCriterion(criterionA, criterionB);

            if (reducedCriterion !== null) {
                nextReduced.push(reducedCriterion);
            }

            if (reducedCriterion !== criterionA && !didReduce) {
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
