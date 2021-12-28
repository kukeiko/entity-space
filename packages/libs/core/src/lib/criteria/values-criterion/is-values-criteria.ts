import { ValuesCriteria } from "./values-criteria";
import { ValuesCriterion } from "./values-criterion";

export function isValuesCriteria(x?: any): x is ValuesCriteria {
    // [todo] instead just probe the first element to improve performance
    return x instanceof Array && x.every(x => ValuesCriterion.is(x));
}
