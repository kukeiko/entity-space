import { IsFalseCriterion } from "./is-false-criterion";
import { IsTrueCriterion } from "./is-true-criterion";

export function isTrue<T extends boolean>(flag: T): T extends true ? IsTrueCriterion : IsFalseCriterion {
    return flag === true ? new IsTrueCriterion() : new IsFalseCriterion();
}
