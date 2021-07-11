import { subtractSets } from "../../../utils";
import { ValueCriterion } from "../value-criterion";
import { InStringSetCriterion } from "./in-string-set-criterion";
import { NotInSetCriterion } from "./not-in-set-criterion";

export class NotInStringSetCriterion extends NotInSetCriterion<string> {
    constructor(values: Iterable<string>) {
        super(values);
    }

    reduce(other: ValueCriterion): false | ValueCriterion<string>[] {
        if (other instanceof InStringSetCriterion) {
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
                return [new InStringSetCriterion(copy)];
            }
        } else if (other instanceof NotInStringSetCriterion) {
            const remaining = subtractSets(this.values, other.values);
            if (remaining.size === 0) {
                return [];
            }

            return [new InStringSetCriterion(remaining)];
        }

        return false;
    }

    invert(): ValueCriterion<string>[] {
        return [new InStringSetCriterion(this.values)];
    }
}
