import { ICriterion } from "../criterion.interface";
import { IInNumberRangeCriterion, IInNumberRangeCriterion$ } from "./in-number-range-criterion.interface";
import { InRangeCriterion } from "./in-range-criterion-base";

export class InNumberRangeCriterion extends InRangeCriterion<number> implements IInNumberRangeCriterion {
    readonly [IInNumberRangeCriterion$] = true;

    override merge(other: ICriterion): false | ICriterion {
        const result = super.merge(other);

        if (result === false && IInNumberRangeCriterion.is(other)) {
            const otherFrom = other.getFrom();
            const otherTo = other.getTo();
            const selfFrom = this.getFrom();
            const selfTo = this.getTo();

            // [todo] do the "otherFrom?.op !== selfTo?.op" & "otherTo?.op !== selfFrom?.op" checks even make sense?
            // busy with other stuff right now, so i'll look into it later™.
            if (otherFrom?.value === selfTo?.value && otherFrom?.op !== selfTo?.op) {
                return this.factory.inRange(selfFrom?.value, otherTo?.value, [
                    selfFrom?.op === ">=",
                    otherTo?.op === "<=",
                ]);
            } else if (otherTo?.value === selfFrom?.value && otherTo?.op !== selfFrom?.op) {
                return this.factory.inRange(otherFrom?.value, selfTo?.value, [
                    otherFrom?.op === ">=",
                    selfTo?.op === "<=",
                ]);
            } else if (
                otherFrom?.value &&
                selfTo?.value &&
                otherFrom.op === ">=" &&
                selfTo.op === "<=" &&
                otherFrom.value - 1 === selfTo.value
            ) {
                // [todo] only tested in mergeQuery(), should write test within criteria pkg as well
                return this.factory.inRange(selfFrom?.value, otherTo?.value, [
                    selfFrom?.op === ">=",
                    otherTo?.op === "<=",
                ]);
            } else if (
                selfFrom?.value &&
                otherTo?.value &&
                selfFrom.op === ">=" &&
                otherTo.op === "<=" &&
                selfFrom.value - 1 === otherTo.value
            ) {
                // [todo] only tested in mergeQuery(), should write test within criteria pkg as well
                return this.factory.inRange(otherFrom?.value, selfTo?.value, [
                    otherFrom?.op === ">=",
                    selfTo?.op === "<=",
                ]);
            }
        }

        return result;
    }
}
