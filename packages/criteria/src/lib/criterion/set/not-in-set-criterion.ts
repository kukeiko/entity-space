import { Null, Primitive, subtractSets } from "@entity-space/utils";
import { Criteria } from "../criteria";
import { Criterion } from "../criterion";
import { InSetCriterion } from "./in-set-criterion";
import { inSet } from "./in-set.fn";
import { notInSet } from "./not-in-set.fn";

export class NotInSetCriterion<T extends ReturnType<Primitive | typeof Null>> extends Criterion {
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

    subtractFrom(other: Criterion): boolean | Criterion {
        if (other instanceof Criteria) {
            return other.reduceBy(this);
        } else if (other instanceof InSetCriterion) {
            const copy = new Set(other.getValues());

            for (const value of other.getValues()) {
                if (!this.values.has(value)) {
                    copy.delete(value);
                }
            }

            if (copy.size === other.getValues().size) {
                return false;
            } else if (copy.size === 0) {
                return true;
            } else {
                return inSet(copy);
            }
        } else if (other instanceof NotInSetCriterion) {
            const remaining = subtractSets(this.values, other.values);
            if (remaining.size === 0) {
                return true;
            }

            return inSet(remaining);
        }

        return false;
    }

    override merge(other: Criterion): false | Criterion {
        if (other instanceof NotInSetCriterion) {
            return notInSet([...this.values, ...other.values]);
        }

        return false;
    }

    override intersect(other: Criterion): false | Criterion {
        return this.merge(other);
    }

    override invert(): Criterion {
        return inSet(this.values);
    }

    matches(value: any): boolean {
        return !this.values.has(value);
    }

    toString(): string {
        return `!{${Array.from(this.values)
            .map(value => {
                if (value === null) return "null";
                if (typeof value === "string") return `"${value}"`;

                return value.toString();
            })
            .join(", ")}}`;
    }
}
