import { Criterion } from "../criterion";
import { subtractCriterion } from "../subtract/subtract-criterion.fn";

export function isSubsetCriterion(what?: Criterion, of?: Criterion): boolean {
    if (what === of) {
        return true;
    } else if (what === undefined) {
        return false;
    } else if (of === undefined) {
        return true;
    } else {
        return subtractCriterion(what, of) === true;
    }
}
