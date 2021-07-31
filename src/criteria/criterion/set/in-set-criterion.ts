import { Class, getInstanceClass } from "../../../utils";
import { InRangeCriterion } from "../range";
import { Criteria } from "../criteria";
import { Criterion } from "../criterion";
import { NotInSetCriterion } from "./not-in-set-criterion";

export abstract class InSetCriterion<T> extends Criterion {
    constructor(values: Iterable<T>) {
        super();
        this.values = new Set(values);
    }

    protected readonly values: Set<T>;
    protected abstract notInClass: Class<NotInSetCriterion<T>>;
    protected abstract inRangeClass: Class<InRangeCriterion<T>>;

    getValues(): ReadonlySet<T> {
        return this.values;
    }

    reduce(other: Criterion): boolean | Criterion {
        if (other instanceof Criteria) {
            return super.reduceValueCriteria(other);
        } else if (other instanceof getInstanceClass(this)) {
            const copy = new Set(other.getValues());

            for (const value of this.values) {
                copy.delete(value);
            }

            if (copy.size === other.getValues().size) {
                return false;
            } else if (copy.size === 0) {
                return true;
            } else {
                return new (getInstanceClass(this))(copy);
            }
        } else if (other instanceof this.notInClass) {
            const merged = new Set([...other.getValues(), ...this.values]);

            return new this.notInClass(merged);
        } else if (other instanceof this.inRangeClass) {
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
                return new this.inRangeClass([otherFrom?.value, otherTo?.value], [otherFrom?.op === ">=", otherTo?.op === "<="]);
            }
        }

        return false;
    }

    invert(): Criterion {
        return new this.notInClass(this.values);
    }

    toString(): string {
        return `{${Array.from(this.values).join(", ")}}`;
    }
}
