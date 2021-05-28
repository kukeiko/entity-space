import { ValueCriteria } from "../value-criteria";
import { NotInSetCriterion } from "./not-in-set-criterion";

export function invertNotInSet(criterion: NotInSetCriterion): ValueCriteria {
    return [{ op: "in", values: new Set(criterion.values) }];
}
