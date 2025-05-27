import { Primitive } from "@entity-space/utils";
import { Criterion } from "../criterion";
import { EqualsCriterion } from "../equals-criterion";
import { InArrayCriterion } from "../in-array-criterion";
import { InRangeCriterion, isFromInsideFromTo, isToInsideFromTo } from "../in-range-criterion";
import { OrCriterion } from "../or-criterion";

export function subtractByInRangeCriterion(inRangeCriterion: InRangeCriterion, what: Criterion): boolean | Criterion {
    if (
        what instanceof InRangeCriterion &&
        what.getValueType() === Number &&
        inRangeCriterion.getValueType() === Number
    ) {
        const otherFrom = what.getFrom();
        const otherTo = what.getTo();
        const selfFrom = inRangeCriterion.getFrom();
        const selfTo = inRangeCriterion.getTo();

        const otherFromInsideMe = isFromInsideFromTo(
            what.getFrom(),
            inRangeCriterion.getFrom(),
            inRangeCriterion.getTo(),
        );

        const otherToInsideMe = isToInsideFromTo(what.getTo(), inRangeCriterion.getFrom(), inRangeCriterion.getTo());

        if (otherFromInsideMe && otherToInsideMe) {
            return true;
        } else if (otherFromInsideMe) {
            if (selfTo === undefined) {
                return true;
            } else {
                return new InRangeCriterion(selfTo.value, otherTo?.value, [!selfTo.inclusive, !!otherTo?.inclusive]);
            }
        } else if (otherToInsideMe) {
            if (selfFrom === undefined) {
                return true;
            } else {
                return new InRangeCriterion(otherFrom?.value, selfFrom.value, [
                    !!otherFrom?.inclusive,
                    !selfFrom.inclusive,
                ]);
            }
        } else if (
            isFromInsideFromTo(selfFrom, what.getFrom(), what.getTo()) &&
            isToInsideFromTo(selfTo, what.getFrom(), what.getTo())
        ) {
            return new OrCriterion([
                new InRangeCriterion(otherFrom?.value, selfFrom?.value, [!!otherFrom?.inclusive, !selfFrom?.inclusive]),
                new InRangeCriterion(selfTo?.value, otherTo?.value, [!selfTo?.inclusive, !!otherTo?.inclusive]),
            ]);
        }
    } else if (what instanceof InArrayCriterion) {
        const remaining = new Set<ReturnType<Primitive>>();

        for (const value of what.getValues()) {
            if (!inRangeCriterion.contains(value)) {
                remaining.add(value);
            }
        }

        if (remaining.size === 0) {
            return true;
        } else if (remaining.size < what.getValues().length) {
            if (remaining.size === 1) {
                return new EqualsCriterion(remaining.values().next().value);
            } else {
                return new InArrayCriterion(Array.from(remaining));
            }
        }
    }

    return false;
}
