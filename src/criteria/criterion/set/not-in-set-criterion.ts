import { Class, getInstanceClass, subtractSets } from "../../../utils";
import { Criteria } from "../criteria";
import { Criterion } from "../criterion";
import { InSetCriterion } from "./in-set-criterion";

export abstract class NotInSetCriterion<T> extends Criterion {
    constructor(values: Iterable<T>) {
        super();
        this.values = new Set(values);
    }

    protected readonly values: Set<T>;
    abstract readonly inSetClass: Class<InSetCriterion<T>>;

    getValues(): ReadonlySet<T> {
        return this.values;
    }

    reduce(other: this): boolean | InstanceType<this["inSetClass"]>;
    reduce(other: InstanceType<this["inSetClass"]>): boolean | InstanceType<this["inSetClass"]>;
    reduce(other: Criterion): boolean | Criterion;
    reduce(other: Criterion): boolean | Criterion {
        if (other instanceof Criteria) {
            return other.reduceBy(this);
        } else if (other instanceof this.inSetClass) {
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
                return new this.inSetClass(copy);
            }
        } else if (other instanceof getInstanceClass(this)) {
            const remaining = subtractSets(this.values, other.values);
            if (remaining.size === 0) {
                return true;
            }

            return new this.inSetClass(remaining);
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
            return new selfClass([...this.values, ...other.values]);
        }

        return false;
    }

    invert(): Criterion {
        return new this.inSetClass(this.values);
    }

    toString(): string {
        return `!{${Array.from(this.values).join(", ")}}`;
    }
}
