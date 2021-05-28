import { ValueCriteria } from "../value-criteria";
import { InSetCriterion } from "./in-set-criterion";

export function invertInSet(criterion: InSetCriterion): ValueCriteria {
    return [{ op: "not-in", values: new Set(criterion.values) }];
}
