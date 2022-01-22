import { InStringSetCriterion } from "./in-string-set-criterion";
import { NotInSetCriterion } from "./not-in-set-criterion";

export class NotInStringSetCriterion extends NotInSetCriterion<string> {
    inSetClass = InStringSetCriterion;
}
