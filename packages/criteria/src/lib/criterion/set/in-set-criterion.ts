import { Null, Primitive } from "@entity-space/utils";
import { Criteria } from "../criteria";
import { Criterion } from "../criterion";
import { InNumberRangeCriterion } from "../range/in-number-range-criterion";
import { inRange } from "../range/in-range.fn";
import { inSet } from "./in-set.fn";
import { NotInSetCriterion } from "./not-in-set-criterion";
import { notInSet } from "./not-in-set.fn";

export class InSetCriterion<T extends ReturnType<Primitive | typeof Null>> extends Criterion {
    constructor(values: Iterable<T>) {
        super();
        this.values = Object.freeze(new Set(values));
    }

    private readonly values: ReadonlySet<T>;

    getValues(): ReadonlySet<T> {
        return this.values;
    }

    getValuesOfType<U extends Primitive | typeof Null>(type: U[]): ReturnType<U>[] {
        const values: ReturnType<U>[] = [];
        const valueTypes = new Set(type.map(type => typeof type()));

        for (const value of this.values) {
            // [todo] doesn't work w/ null
            if (valueTypes.has(typeof value)) {
                // [todo] get rid of any
                values.push(value as any);
            }
        }

        return values;
    }

    matches(item: any): boolean {
        return this.values.has(item);
    }

    reduce(other: Criterion): boolean | Criterion {
        if (other instanceof Criteria) {
            return other.reduceBy(this);
        } else if (other instanceof InSetCriterion) {
            const copy = new Set(other.getValues());

            for (const value of this.values) {
                copy.delete(value);
            }

            if (copy.size === other.getValues().size) {
                return false;
            } else if (copy.size === 0) {
                return true;
            } else {
                return inSet(copy);
            }
        } else if (other instanceof NotInSetCriterion) {
            const merged = new Set([...other.getValues(), ...this.values]);

            return notInSet(merged);
        } else if (other instanceof InNumberRangeCriterion) {
            const selfValues = this.getValues();
            let otherFrom = other.getFrom();
            let otherTo = other.getTo();
            let didReduce = false;

            // [todo] get rid of any
            if (otherFrom?.op === ">=" && selfValues.has(otherFrom.value as any)) {
                otherFrom = { op: ">", value: otherFrom.value };
                didReduce = true;
            }

            // [todo] get rid of any
            if (otherTo?.op === "<=" && selfValues.has(otherTo.value as any)) {
                otherTo = { op: "<", value: otherTo.value };
                didReduce = true;
            }

            if (didReduce) {
                return inRange(otherFrom?.value, otherTo?.value, [otherFrom?.op === ">=", otherTo?.op === "<="]);
            }
        }

        return false;
    }

    override merge(other: Criterion): false | Criterion {
        if (other instanceof InSetCriterion) {
            return inSet([...this.getValues(), ...other.getValues()]);
        }

        return false;
    }

    override intersect(other: Criterion): false | Criterion {
        if (other instanceof InSetCriterion) {
            // [todo] get rid of any
            const intersection = new Set<any>();

            for (const value of other.getValues()) {
                if (this.values.has(value)) {
                    intersection.add(value);
                }
            }

            return inSet(intersection);
        }

        return false;
    }

    override invert(): Criterion {
        // [todo] get rid of any
        return notInSet(this.getValues() as any);
    }

    toString(): string {
        return `{${Array.from(this.values)
            .map(value => {
                if (value === null) return "null";
                if (typeof value === "string") return `"${value}"`;

                return value.toString();
            })
            .join(", ")}}`;
    }
}
