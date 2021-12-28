import { InStringRangeCriterion } from "../range";
import { NotInStringSetCriterion } from "./not-in-string-set-criterion";
import { InSetCriterion } from "./in-set-criterion";

export class InStringSetCriterion extends InSetCriterion<string> {
    inRangeClass = InStringRangeCriterion;
    notInClass = NotInStringSetCriterion;
}
