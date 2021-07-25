import { AndCriteria } from "./and-criteria";
import { Criteria } from "./criteria";
import { Criterion } from "./criterion";

// [todo] inconsistent w/ entityCriteria() which accepts construction arguments instead of already instantiated items
export function and<T>(criteria: Criterion<T>[]): Criteria<T> {
    return new AndCriteria(criteria);
}
