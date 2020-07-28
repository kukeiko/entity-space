import { Criteria } from "./criteria";
import { reduceCriterion } from "./reduce-criterion";

export function reduceCriteria(a: Criteria, b: Criteria): Criteria | null {
    if (a.length === 0 && b.length === 0) {
        return null;
    }

    let reduced = a.slice();
    let didReduce = false;

    for (let criterionB of b) {
        let nextReduced: Criteria = [];

        for (let criterionA of reduced) {
            let reducedCriterion = reduceCriterion(criterionB, criterionA);

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
