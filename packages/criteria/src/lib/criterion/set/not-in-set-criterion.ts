import { PrimitiveIncludingNull, subtractSets } from "@entity-space/utils";
import { Criteria } from "../criteria";
import { Criterion } from "../criterion";
import { InSetCriterion } from "./in-set-criterion";
import { inSet } from "./in-set.fn";
import { notInSet } from "./not-in-set.fn";

export class NotInValueSetCriterion_V2<T extends PrimitiveIncludingNull = PrimitiveIncludingNull> extends Criterion {
    constructor(valueTypes: T[], values: Iterable<ReturnType<T>>) {
        super();
        this.valueTypes = Object.freeze(valueTypes.slice());
        this.values = Object.freeze(new Set(values));
    }

    private readonly valueTypes: readonly T[];
    private readonly values: ReadonlySet<ReturnType<T>>;

    getValues(): ReadonlySet<ReturnType<T>> {
        return this.values;
    }

    getValuesOfType<U extends PrimitiveIncludingNull>(type: U[]): ReturnType<U>[] {
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

    getValueTypes(): readonly T[] {
        return this.valueTypes;
    }

    reduce(other: Criterion): boolean | Criterion {
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
        } else if (other instanceof NotInValueSetCriterion_V2) {
            const remaining = subtractSets(this.values, other.values);
            if (remaining.size === 0) {
                return true;
            }

            return inSet(remaining);
        }

        return false;
    }

    override merge(other: Criterion): false | Criterion {
        if (other instanceof NotInValueSetCriterion_V2) {
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
