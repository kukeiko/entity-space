import { ValueCriteria } from "./value-criteria";
import { ValueCriterion } from "./value-criterion";

export function valueMatches<T>(criteria: ValueCriterion<T>[]): ValueCriteria<T> {
    return new ValueCriteria(criteria);
}
