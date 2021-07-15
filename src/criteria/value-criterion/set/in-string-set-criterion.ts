import { StringRangeCriterion } from "../range";
import { NotInStringSetCriterion } from "./not-in-string-set-criterion";
import { InSetCriterion } from "./in-set-criterion";

export class InStringSetCriterion extends InSetCriterion<string> {
    constructor(values: Iterable<string>) {
        super(values);
    }

    inRangeClass = StringRangeCriterion;
    notInClass = NotInStringSetCriterion;
}
