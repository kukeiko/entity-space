import { getInstanceClass, Null, Primitive } from "@entity-space/utils";
import { Criteria } from "../criteria";
import { Criterion } from "../criterion";
import { InSetCriterion } from "../set/in-set-criterion";
import { inSet } from "../set/in-set.fn";
import { notValue } from "./not-value.fn";

export class IsValueCriterion<
    T extends ReturnType<Primitive | typeof Null> = ReturnType<Primitive | typeof Null>
> extends Criterion {
    constructor(value: T) {
        super();
        this.value = value;
    }

    private readonly value: T;

    getValue(): T {
        return this.value;
    }

    matches(value: unknown): boolean {
        return value === this.value;
    }

    // [todo] some reduction cases were missing - seems like i was sloppy? figure out if there are more,
    // and not only here, but in all criterion implementations
    subtractFrom(other: Criterion): boolean | Criterion {
        if (other instanceof Criteria) {
            // [todo] added this case - write test for it
            return other.reduceBy(this);
        } else if (other instanceof getInstanceClass(this) && other.getValue() === this.getValue()) {
            return true;
        } else if (other instanceof InSetCriterion && other.getValues().has(this.getValue())) {
            // [todo] added this case - write test for it
            const withoutMyValue = new Set(other.getValues());
            withoutMyValue.delete(this.getValue());

            if (withoutMyValue.size === 0) {
                return true;
            }

            return new InSetCriterion(withoutMyValue);
        }

        return false;
    }

    override intersect(other: Criterion): false | Criterion {
        if (other instanceof IsValueCriterion) {
            if (this.value !== other.getValue()) {
                return false;
            }

            return this;
        } else if (other instanceof InSetCriterion) {
            if (!other.hasValue(this.getValue())) {
                return false;
            }

            return this;
        }

        return false;
    }

    override invert(): Criterion {
        return notValue(this.value);
    }

    override merge(other: Criterion): false | Criterion {
        if (other instanceof IsValueCriterion) {
            if (this.value === other.value) {
                return this;
            } else {
                return inSet([this.value, other.value]);
            }
        } else if (other instanceof InSetCriterion) {
            return inSet([this.value, ...other.getValues()]);
        }

        return false;
    }

    toString(): string {
        if (this.value === null) {
            return "null";
        } else if (typeof this.value === "string") {
            return `"${this.value}"`;
        }

        return this.value.toString();
    }
}
