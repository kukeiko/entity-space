import { OrCriteria } from "./or-criteria";
import { Criteria } from "./criteria";
import { Criterion } from "./criterion";

export function or<T extends Criterion>(criteria: T[]): Criteria<T> {
    return new OrCriteria(criteria);
}
