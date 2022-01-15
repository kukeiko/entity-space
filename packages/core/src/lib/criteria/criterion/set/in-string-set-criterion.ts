import { InStringRangeCriterion } from "../range";
import { InSetCriterion } from "./in-set-criterion";
import { NotInStringSetCriterion } from "./not-in-string-set-criterion";

export class InStringSetCriterion extends InSetCriterion<string> {
    inRangeClass = InStringRangeCriterion;
    notInClass = NotInStringSetCriterion;
}
