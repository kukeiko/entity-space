import { ValuesCriterion } from "./values-criterion";

export type ValuesCriteria = ValuesCriterion[];

export module ValuesCriteria {
    export function is(x?: any): x is ValuesCriteria {
        return x instanceof Array && x.every(x => ValuesCriterion.is(x));
    }
}
