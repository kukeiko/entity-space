import { subtractSets } from "../../../utils";
import { ValueCriterion } from "../value-criterion";
import { InNumberSetCriterion } from "./in-number-set-criterion";
import { NotInSetCriterion } from "./not-in-set-criterion";

export class NotInNumberSetCriterion extends NotInSetCriterion<number> {
    constructor(values: Iterable<number>) {
        super(values);
    }

    reduce(other: ValueCriterion): false | ValueCriterion<number>[] {
        if (other instanceof InNumberSetCriterion) {
            // if (isNumberSetCriterion(other)) {
            const copy = new Set(other.getValues());

            for (const value of other.getValues()) {
                if (!this.values.has(value)) {
                    copy.delete(value);
                }
            }

            if (copy.size === other.getValues().size) {
                return false;
            } else if (copy.size === 0) {
                return [];
            } else {
                return [new InNumberSetCriterion(copy)];
            }
        } else if (other instanceof NotInNumberSetCriterion) {
            const remaining = subtractSets(this.values, other.values);
            if (remaining.size === 0) {
                return [];
            }

            return [new InNumberSetCriterion(remaining)];
        }

        return false;
    }

    invert(): ValueCriterion<number>[] {
        return [new InNumberSetCriterion(this.values)];
    }
}
