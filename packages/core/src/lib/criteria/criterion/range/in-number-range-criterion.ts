import { Criterion } from "../criterion";
import { InRangeCriterion } from "./in-range-criterion";

export class InNumberRangeCriterion extends InRangeCriterion<number> {
    override merge(other: Criterion): false | Criterion {
        const result = super.merge(other);

        if (result === false && other instanceof InNumberRangeCriterion) {
            const otherFrom = other.getFrom();
            const otherTo = other.getTo();
            const selfFrom = this.getFrom();
            const selfTo = this.getTo();

            // [todo] do the "otherFrom?.op !== selfTo?.op" & "otherTo?.op !== selfFrom?.op" checks even make sense?
            // busy with other stuff right now, so i'll look into it later™.
            if (otherFrom?.value === selfTo?.value && otherFrom?.op !== selfTo?.op) {
                return new InNumberRangeCriterion(
                    [selfFrom?.value, otherTo?.value],
                    [selfFrom?.op === ">=", otherTo?.op === "<="]
                );
            } else if (otherTo?.value === selfFrom?.value && otherTo?.op !== selfFrom?.op) {
                return new InNumberRangeCriterion(
                    [otherFrom?.value, selfTo?.value],
                    [otherFrom?.op === ">=", selfTo?.op === "<="]
                );
            } else if (
                otherFrom?.value &&
                selfTo?.value &&
                otherFrom.op === ">=" &&
                selfTo.op === "<=" &&
                otherFrom.value - 1 === selfTo.value
            ) {
                // [todo] only tested in mergeQuery(), should write test within criteria pkg as well
                return new InNumberRangeCriterion(
                    [selfFrom?.value, otherTo?.value],
                    [selfFrom?.op === ">=", otherTo?.op === "<="]
                );
            } else if (
                selfFrom?.value &&
                otherTo?.value &&
                selfFrom.op === ">=" &&
                otherTo.op === "<=" &&
                selfFrom.value - 1 === otherTo.value
            ) {
                // [todo] only tested in mergeQuery(), should write test within criteria pkg as well
                return new InNumberRangeCriterion(
                    [otherFrom?.value, selfTo?.value],
                    [otherFrom?.op === ">=", selfTo?.op === "<="]
                );
            }
        }

        return result;
    }
}
