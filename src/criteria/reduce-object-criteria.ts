import { ObjectCriteria } from "./object-criteria";
import { reduceObjectCriterion } from "./reduce-object-criterion";

export function reduceObjectCriteria(a: ObjectCriteria, b: ObjectCriteria): ObjectCriteria | null {
    if (a.length === 0 && b.length === 0) {
        return null;
    }

    let reduced = a.slice();
    let didReduce = false;

    for (let criterionB of b) {
        let nextReduced: ObjectCriteria = [];

        for (let criterionA of reduced) {
            let reducedCriterion = reduceObjectCriterion(criterionA, criterionB);

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
