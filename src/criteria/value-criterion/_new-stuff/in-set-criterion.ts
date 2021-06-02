import { ValueCriterion } from "./value-criterion";

export class InSetCriterion<T extends boolean | string | number> implements ValueCriterion<T | null> {
    constructor(valueType: () => T, values: Iterable<T>) {
        this.valueType = valueType;
        this.values = new Set(values);
    }

    private readonly values: Set<T>;

    static is<T extends string | number | boolean>(x: unknown, valueType: () => T): x is InSetCriterion<T> {
        return x instanceof InSetCriterion && x.valueType === valueType;
    }

    valueType: () => T;

    getValues(): ReadonlySet<T> {
        return this.values;
    }

    reduce(other: ValueCriterion<T | null>): ValueCriterion<T | null>[] | false {
        if (InSetCriterion.is(other, this.valueType)) {
            const copy = new Set(other.getValues());

            for (const value of this.values) {
                copy.delete(value);
            }

            if (copy.size === other.getValues().size) {
                return false;
            } else if (copy.size === 0) {
                return [];
            } else {
                return [new InSetCriterion(other.valueType, copy)];
            }
        }

        return false;
    }
}
