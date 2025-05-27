import { Criterion } from "../criterion";
import { EqualsCriterion } from "../equals-criterion";
import { InArrayCriterion } from "../in-array-criterion";

export function subtractByEqualsCriterion(equalsCriterion: EqualsCriterion, what: Criterion): boolean | Criterion {
    if (what instanceof EqualsCriterion) {
        return equalsCriterion.getValue() === what.getValue();
    } else if (what instanceof InArrayCriterion && what.contains(equalsCriterion.getValue())) {
        const withoutMyValue = new Set(what.getValues());
        withoutMyValue.delete(equalsCriterion.getValue());

        if (withoutMyValue.size === 0) {
            return true;
        }

        return new InArrayCriterion(Array.from(withoutMyValue));
    }

    return false;
}
