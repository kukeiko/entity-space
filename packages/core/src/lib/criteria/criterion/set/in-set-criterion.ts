import { Class, getInstanceClass } from "@entity-space/utils";
import { Criteria } from "../criteria";
import { Criterion } from "../criterion";
import { InRangeCriterion } from "../range";
import { NotInSetCriterion } from "./not-in-set-criterion";

export abstract class InSetCriterion<T> extends Criterion {
    constructor(values: Iterable<T>) {
        super();
        this.values = Object.freeze(new Set(values));
    }

    protected readonly values: ReadonlySet<T>;
    abstract readonly notInClass: Class<NotInSetCriterion<T>>;
    abstract readonly inRangeClass: Class<InRangeCriterion<T>>;

    getValues(): ReadonlySet<T> {
        return this.values;
    }

    reduce(other: Criterion): boolean | Criterion {
        if (other instanceof Criteria) {
            return other.reduceBy(this);
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
                return new this.inRangeClass(
                    [otherFrom?.value, otherTo?.value],
                    [otherFrom?.op === ">=", otherTo?.op === "<="]
                );
            }
        }

        return false;
    }

    merge(other: Criterion): false | Criterion {
        const selfClass = getInstanceClass(this);

        if (other instanceof selfClass) {
            return new selfClass([...this.values, ...other.values]);
        }

        return false;
    }

    intersect(other: Criterion): false | Criterion {
        const selfClass = getInstanceClass(this);

        if (other instanceof selfClass) {
            const intersection = new Set();

            for (const value of other.getValues()) {
                if (this.values.has(value)) {
                    intersection.add(value);
                }
            }

            return new selfClass(intersection);
        }

        return false;
    }

    invert(): Criterion {
        return new this.notInClass(this.values);
    }

    toString(): string {
        return `{${Array.from(this.values).join(", ")}}`;
    }

    matches(value: any): boolean {
        return this.values.has(value);
    }
}
