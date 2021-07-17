import { IsEvenCriterion } from "./is-even-criterion";
import { IsOddCriterion } from "./is-odd-criterion";

export function isEven<T extends boolean>(flag: T): T extends true ? IsEvenCriterion : IsOddCriterion {
    return flag === true ? new IsEvenCriterion() : new IsOddCriterion();
}
