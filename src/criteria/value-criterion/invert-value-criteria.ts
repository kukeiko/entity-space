import { invertValueCriterion } from "./invert-value-criterion";
import { ValueCriteria } from "./value-criteria";

export function invertValueCriteria(criteria: ValueCriteria): ValueCriteria {
    const inverted: ValueCriteria = [];

    for (const criterion of criteria) {
        inverted.push(...invertValueCriterion(criterion));
    }

    return inverted;
}
