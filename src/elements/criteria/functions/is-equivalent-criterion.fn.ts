import { Criterion } from "../criterion";
import { subtractCriterion } from "../subtract/subtract-criterion.fn";

export function isEquivalentCriterion(a?: Criterion, b?: Criterion): boolean {
    if (a === b) {
        return true;
    } else if (a === undefined) {
        return false;
    } else if (b === undefined) {
        return false;
    } else {
        return subtractCriterion(a, b) === true && subtractCriterion(b, a) === true;
    }
}
