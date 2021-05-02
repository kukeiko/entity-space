import { ValueCriterion } from "../value-criterion";
import { NotInValueCriterion } from "./not-in-value-criterion";

export function reduceNotInValueCriterion(a: NotInValueCriterion, b: ValueCriterion): NotInValueCriterion | null {
    return a;
}
