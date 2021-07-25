import { OrCriteria } from "./or-criteria";
import { Criteria } from "./criteria";
import { Criterion } from "./criterion";

// [todo] inconsistent w/ entityCriteria() which accepts construction arguments instead of already instantiated items
export function or<T>(criteria: Criterion<T>[]): Criteria<T> {
    return new OrCriteria(criteria);
}
