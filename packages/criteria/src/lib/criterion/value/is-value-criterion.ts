import { getInstanceClass, PrimitiveIncludingNull } from "@entity-space/utils";
import { Criterion } from "../criterion";
import { notValue } from "./not-value.fn";

export class IsValueCriterion<T extends PrimitiveIncludingNull = PrimitiveIncludingNull> extends Criterion {
    constructor(valueTypes: T[], value: ReturnType<T>) {
        super();
        this.valueTypes = Object.freeze(valueTypes.slice());
        this.value = value;
    }

    private readonly valueTypes: readonly T[];
    private readonly value: ReturnType<T>;

    getValue(): ReturnType<T> {
        return this.value;
    }

    matches<T>(item: T): boolean {
        return item === this.value;
    }

    reduce(other: Criterion): boolean | Criterion {
        if (other instanceof getInstanceClass(this) && other.getValue() === this.getValue()) {
            return true;
        }

        return false;
    }

    override intersect(other: Criterion): false | Criterion {
        return this.merge(other);
    }

    override invert(): Criterion {
        return notValue(this.value);
    }

    override merge(other: Criterion): false | Criterion {
        if (other instanceof IsValueCriterion && this.value === other.value) {
            return this;
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