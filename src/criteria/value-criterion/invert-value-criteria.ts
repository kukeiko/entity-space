import { invertValueCriterion } from "./invert-value-criterion";
import { ValueCriteria } from "./value-criteria";

export function invertValueCriteria(criteria: ValueCriteria): ValueCriteria {
    const inverted: ValueCriteria = [];

    for (const criterion of criteria) {
        const invertedCriteria = invertValueCriterion(criterion);

        if (invertedCriteria[0] === criterion) {
            return criteria;
        }

        inverted.push(...invertedCriteria);
    }

    return inverted;
}
