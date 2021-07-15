import { NumberRangeCriterion } from "../range";
import { NotInNumberSetCriterion } from "./not-in-number-set-criterion";
import { InSetCriterion } from "./in-set-criterion";

export class InNumberSetCriterion extends InSetCriterion<number> {
    constructor(values: Iterable<number>) {
        super(values);
    }

    inRangeClass = NumberRangeCriterion;
    notInClass = NotInNumberSetCriterion;
}
