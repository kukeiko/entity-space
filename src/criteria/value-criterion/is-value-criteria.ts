import { ValueCriteria } from "./value-criteria";
import { isValueCriterion } from "./is-value-criterion";

export function isValueCriteria(x?: any): x is ValueCriteria {
    // [todo] instead just probe the first element to improve performance
    return x instanceof Array && x.every(x => isValueCriterion(x));
}
