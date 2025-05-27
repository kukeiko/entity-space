import { Criterion } from "../criterion";
import { InArrayCriterion } from "../in-array-criterion";
import { NotInArrayCriterion } from "../not-in-array-criterion";

export function subtractByNotInArrayCriterion(
    notInArrayCriterion: NotInArrayCriterion,
    what: Criterion,
): boolean | Criterion {
    if (what instanceof InArrayCriterion) {
        const copy = new Set(what.getValues());

        for (const value of what.getValues()) {
            if (notInArrayCriterion.contains(value)) {
                copy.delete(value);
            }
        }

        if (copy.size === what.getValues().length) {
            return false;
        } else if (copy.size === 0) {
            return true;
        } else {
            return new InArrayCriterion(Array.from(copy));
        }
    } else if (what instanceof NotInArrayCriterion) {
        const copy = new Set(notInArrayCriterion.getValues());

        for (const value of notInArrayCriterion.getValues()) {
            if (!what.contains(value)) {
                copy.delete(value);
            }
        }

        if (copy.size === 0) {
            return true;
        } else {
            return new InArrayCriterion(Array.from(copy));
        }
    }

    return false;
}
