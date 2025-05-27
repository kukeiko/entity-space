import { Criterion } from "../criterion";
import { EqualsCriterion } from "../equals-criterion";
import { NotEqualsCriterion } from "../not-equals-criterion";

export function subtractByNotEqualsCriterion(
    notEqualsCriterion: NotEqualsCriterion,
    what: Criterion,
): boolean | Criterion {
    if (what instanceof EqualsCriterion) {
        if (notEqualsCriterion.contains(what.getValue())) {
            return true;
        }
    } else if (what instanceof NotEqualsCriterion) {
        if (notEqualsCriterion.getValue() === what.getValue()) {
            return true;
        } else {
            return new EqualsCriterion(notEqualsCriterion.getValue());
        }
    }

    return false;
}
