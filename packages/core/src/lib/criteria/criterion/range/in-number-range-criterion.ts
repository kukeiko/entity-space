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
            }
        }

        return result;
    }
}
