import { InNumberRangeCriterion } from "../range";
import { NotInNumberSetCriterion } from "./not-in-number-set-criterion";
import { InSetCriterion } from "./in-set-criterion";

export class InNumberSetCriterion extends InSetCriterion<number> {
    inRangeClass = InNumberRangeCriterion;
    notInClass = NotInNumberSetCriterion;
}
