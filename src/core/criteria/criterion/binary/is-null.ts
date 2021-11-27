import { IsNotNullCriterion } from "./is-not-null-criterion";
import { IsNullCriterion } from "./is-null-criterion";

export function isNull<T extends boolean>(flag: T): T extends true ? IsNullCriterion : IsNotNullCriterion {
    return flag === true ? new IsNullCriterion() : new IsNotNullCriterion();
}
