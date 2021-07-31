import { AndCriteria } from "./and-criteria";
import { Criteria } from "./criteria";
import { Criterion } from "./criterion";

export function and<T>(criteria: Criterion[]): Criteria {
    return new AndCriteria(criteria);
}
