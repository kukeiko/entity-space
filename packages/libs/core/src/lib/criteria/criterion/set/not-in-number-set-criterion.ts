import { InNumberSetCriterion } from "./in-number-set-criterion";
import { NotInSetCriterion } from "./not-in-set-criterion";

export class NotInNumberSetCriterion extends NotInSetCriterion<number> {
    inSetClass = InNumberSetCriterion;
}
