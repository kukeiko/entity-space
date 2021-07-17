import { AndCombinedValueCriteria } from "./and-combined-value-criteria";
import { ValueCriteria } from "./value-criteria";
import { ValueCriterion } from "./value-criterion";

// [todo] inconsistent w/ entityCriteria() which accepts construction arguments instead of already instantiated items
export function and<T>(criteria: ValueCriterion<T>[]): ValueCriteria<T> {
    return new AndCombinedValueCriteria(criteria);
}
