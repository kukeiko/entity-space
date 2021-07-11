import { ValueCriterion } from "../value-criterion";
import { StringRangeCriterion } from "../range";
import { NotInStringSetCriterion } from "./not-in-string-set-criterion";
import { InSetCriterion } from "./in-set-criterion";

export class InStringSetCriterion extends InSetCriterion<string> {
    constructor(values: Iterable<string>) {
        super(values);
    }

    reduce(other: ValueCriterion): false | ValueCriterion<string>[] {
        if (other instanceof InStringSetCriterion) {
            const copy = new Set(other.getValues());

            for (const value of this.values) {
                copy.delete(value);
            }

            if (copy.size === other.getValues().size) {
                return false;
            } else if (copy.size === 0) {
                return [];
            } else {
                return [new InStringSetCriterion(copy)];
            }
        } else if (other instanceof NotInStringSetCriterion) {
            const merged = new Set([...other.getValues(), ...this.values]);

            return [new NotInStringSetCriterion(merged)];
        } else if (other instanceof StringRangeCriterion) {
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
                return [new StringRangeCriterion([otherFrom?.value, otherTo?.value], [otherFrom?.op === ">=", otherTo?.op === "<="])];
            }
        }

        return false;
    }

    invert(): ValueCriterion<string>[] {
        return [new NotInStringSetCriterion(this.values)];
    }
}
