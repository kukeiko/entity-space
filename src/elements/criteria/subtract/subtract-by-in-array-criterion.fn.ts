import { Criterion } from "../criterion";
import { EqualsCriterion } from "../equals-criterion";
import { InArrayCriterion } from "../in-array-criterion";
import { InRangeCriterion } from "../in-range-criterion";
import { NotInArrayCriterion } from "../not-in-array-criterion";

export function subtractByInArrayCriterion(inArrayCriterion: InArrayCriterion, what: Criterion): boolean | Criterion {
    if (what instanceof InArrayCriterion) {
        const copy = new Set(what.getValues());

        for (const value of inArrayCriterion.getValues()) {
            copy.delete(value);
        }

        if (copy.size === what.getValues().length) {
            return false;
        } else if (copy.size === 0) {
            return true;
        } else {
            return new InArrayCriterion(Array.from(copy));
        }
    } else if (what instanceof NotInArrayCriterion) {
        const merged = new Set([...what.getValues(), ...inArrayCriterion.getValues()]);

        if (merged.size === what.getValues().length) {
            return false;
        }

        return new NotInArrayCriterion(Array.from(merged));
    } else if (what instanceof InRangeCriterion && what.getValueType() === Number) {
        let otherFrom = what.getFrom();
        let otherTo = what.getTo();
        let didSubtract = false;

        if (otherFrom !== undefined && otherFrom.inclusive && inArrayCriterion.contains(otherFrom.value)) {
            otherFrom = { value: otherFrom.value, inclusive: false };
            didSubtract = true;
        }

        if (otherTo !== undefined && otherTo.inclusive && inArrayCriterion.contains(otherTo.value)) {
            otherTo = { value: otherTo.value, inclusive: false };
            didSubtract = true;
        }

        if (didSubtract) {
            return new InRangeCriterion(otherFrom?.value, otherTo?.value, [
                !!otherFrom?.inclusive,
                !!otherTo?.inclusive,
            ]);
        }
    } else if (what instanceof EqualsCriterion && inArrayCriterion.contains(what.getValue())) {
        return true;
    }

    return false;
}
