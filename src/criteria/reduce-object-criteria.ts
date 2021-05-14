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
            let reducedCriteria = reduceObjectCriterion(criterionA, criterionB);
            nextReduced.push(...reducedCriteria);

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
