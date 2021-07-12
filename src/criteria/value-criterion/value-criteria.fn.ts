import { ValueCriteria } from "./value-criteria";
import { ValueCriterion } from "./value-criterion";

// [todo] inconsistent w/ entityCriteria() which accepts construction arguments instead of already instantiated items
export function valueCriteria<T>(criteria: ValueCriterion<T>[]): ValueCriteria<T> {
    return new ValueCriteria(criteria);
}
