import { ValueCriteria } from "../value-criteria";
import { InValueCriterion } from "./in-value-criterion";

export function invertInValueCriterion(criterion: InValueCriterion): ValueCriteria {
    return [{ op: "not-in", values: new Set(criterion.values) }];
}
