import { Class, getInstanceClass, subtractSets } from "../../../utils";
import { ValueCriterion } from "../value-criterion";
import { InSetCriterion } from "./in-set-criterion";

export abstract class NotInSetCriterion<T> extends ValueCriterion<T> {
    constructor(values: Iterable<T>) {
        super();
        this.values = new Set(values);
    }

    protected readonly values: Set<T>;
    protected abstract inSetClass: Class<InSetCriterion<T>>;

    getValues(): ReadonlySet<T> {
        return this.values;
    }

    reduce(other: ValueCriterion): false | ValueCriterion<T>[] {
        if (other instanceof this.inSetClass) {
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
                return [new this.inSetClass(copy)];
            }
        } else if (other instanceof getInstanceClass(this)) {
            const remaining = subtractSets(this.values, other.values);
            if (remaining.size === 0) {
                return [];
            }

            return [new this.inSetClass(remaining)];
        }

        return false;
    }

    invert(): ValueCriterion<T>[] {
        return [new this.inSetClass(this.values)];
    }

    toString(): string {
        return `!{${Array.from(this.values).join(", ")}}`;
    }
}
