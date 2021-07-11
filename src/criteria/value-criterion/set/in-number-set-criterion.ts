import { ValueCriterion } from "../value-criterion";
import { NumberRangeCriterion } from "../range";
import { NotInNumberSetCriterion } from "./not-in-number-set-criterion";
import { InSetCriterion } from "./in-set-criterion";

export class InNumberSetCriterion extends InSetCriterion<number> {
    constructor(values: Iterable<number>) {
        super(values);
    }

    reduce(other: ValueCriterion): false | ValueCriterion<number>[] {
        if (other instanceof InNumberSetCriterion) {
            const copy = new Set(other.getValues());

            for (const value of this.values) {
                copy.delete(value);
            }

            if (copy.size === other.getValues().size) {
                return false;
            } else if (copy.size === 0) {
                return [];
            } else {
                return [new InNumberSetCriterion(copy)];
            }
        } else if (other instanceof NotInNumberSetCriterion) {
            const merged = new Set([...other.getValues(), ...this.values]);

            return [new NotInNumberSetCriterion(merged)];
        } else if (other instanceof NumberRangeCriterion) {
            const selfValues = this.getValues();
            let otherFrom = other.getFrom();
            let otherTo = other.getTo();
            let didReduce = false;

            if (otherFrom?.op === ">=" && selfValues.has(otherFrom.value)) {
                otherFrom = { op: ">", value: otherFrom.value };
                didReduce = true;
            }

            if (otherTo?.op === "<=" && selfValues.has(otherTo.value)) {
                otherTo = { op: "<", value: otherTo.value };
                didReduce = true;
            }

            if (didReduce) {
                return [new NumberRangeCriterion([otherFrom?.value, otherTo?.value], [otherFrom?.op === ">=", otherTo?.op === "<="])];
            }
        }

        return false;
    }

    invert(): ValueCriterion<number>[] {
        return [new NotInNumberSetCriterion(this.values)];
    }
}
