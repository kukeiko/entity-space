import { ValueCriteria } from "../value-criteria";
import { NotInValueCriterion } from "./not-in-value-criterion";

export function invertNotInValueCriterion(criterion: NotInValueCriterion): ValueCriteria {
    return [{ op: "in", values: new Set(criterion.values) }];
}
