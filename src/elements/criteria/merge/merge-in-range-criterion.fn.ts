import { Criterion } from "../criterion";
import { InRangeCriterion, isFromInsideFromTo, isToInsideFromTo } from "../in-range-criterion";

export function mergeInRangeCriterion(criterion: InRangeCriterion, other: Criterion): Criterion | boolean {
    if (!(other instanceof InRangeCriterion)) {
        return false;
    }

    const otherFrom = other.getFrom();
    const otherTo = other.getTo();
    const selfFrom = criterion.getFrom();
    const selfTo = criterion.getTo();
    const otherFromInsideMe = isFromInsideFromTo(other.getFrom(), criterion.getFrom(), criterion.getTo());
    const otherToInsideMe = isToInsideFromTo(other.getTo(), criterion.getFrom(), criterion.getTo());

    if (otherFromInsideMe && otherToInsideMe) {
        return criterion;
    } else if (otherFromInsideMe) {
        if (selfFrom === undefined && otherTo === undefined) {
            return true;
        }
        return new InRangeCriterion(selfFrom?.value, otherTo?.value, [!!selfFrom?.inclusive, !!otherTo?.inclusive]);
    } else if (otherToInsideMe) {
        if (otherFrom === undefined && selfTo === undefined) {
            return true;
        }

        return new InRangeCriterion(otherFrom?.value, selfTo?.value, [!!otherFrom?.inclusive, !!selfTo?.inclusive]);
    } else if (
        isFromInsideFromTo(selfFrom, other.getFrom(), other.getTo()) &&
        isToInsideFromTo(selfTo, other.getFrom(), other.getTo())
    ) {
        return other;
    } else if (
        criterion instanceof InRangeCriterion &&
        criterion.isNumber() &&
        other instanceof InRangeCriterion &&
        other.isNumber()
    ) {
        const otherFrom = other.getFrom();
        const otherTo = other.getTo();
        const selfFrom = criterion.getFrom();
        const selfTo = criterion.getTo();

        if (otherFrom === undefined || otherTo === undefined || selfFrom === undefined || selfTo === undefined) {
            return false;
        }

        if (otherFrom.value === selfTo.value) {
            return new InRangeCriterion(selfFrom.value, otherTo.value, [selfFrom.inclusive, otherTo.inclusive]);
        } else if (otherTo.value === selfFrom.value) {
            return new InRangeCriterion(otherFrom.value, selfTo.value, [otherFrom.inclusive, selfTo.inclusive]);
        } else if (otherFrom.inclusive && selfTo.inclusive && otherFrom.value - 1 === selfTo.value) {
            return new InRangeCriterion(selfFrom.value as number, otherTo.value, [
                selfFrom.inclusive,
                otherTo.inclusive,
            ]);
        } else if (selfFrom.inclusive && otherTo.inclusive && (selfFrom.value as number) - 1 === otherTo.value) {
            return new InRangeCriterion(otherFrom.value, selfTo.value as number, [
                otherFrom.inclusive,
                selfTo.inclusive,
            ]);
        } else {
            return false;
        }
    } else {
        return false;
    }
}
