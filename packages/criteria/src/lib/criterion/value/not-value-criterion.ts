import { getInstanceClass, Null, Primitive } from "@entity-space/utils";
import { Criterion } from "../criterion";
import { isValue } from "./is-value.fn";

export class NotValueCriterion<T extends Primitive | typeof Null = Primitive | typeof Null> extends Criterion {
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

    subtractFrom(other: Criterion): boolean | Criterion {
        if (other instanceof getInstanceClass(this) && other.getValue() === this.getValue()) {
            return true;
        }

        return false;
    }

    override intersect(other: Criterion): false | Criterion {
        return this.merge(other);
    }

    override invert(): Criterion {
        return isValue(this.value);
    }

    override merge(other: Criterion): false | Criterion {
        if (other instanceof NotValueCriterion && this.value === other.value) {
            return this;
        }

        return false;
    }

    toString(): string {
        if (this.value === null) {
            return "!null";
        } else if (typeof this.value === "string") {
            return `!"${this.value}"`;
        }

        return `!${this.value}`;
    }
}
