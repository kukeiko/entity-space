import { InRangeCriterion } from "./in-range-criterion-base";
import { IInStringRangeCriterion, IInStringRangeCriterion$ } from "./in-string-range-criterion.interface";

export class InStringRangeCriterion extends InRangeCriterion<string> implements IInStringRangeCriterion {
    readonly [IInStringRangeCriterion$] = true;
}
