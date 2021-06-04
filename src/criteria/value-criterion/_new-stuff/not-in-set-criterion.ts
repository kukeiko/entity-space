import { subtractSets } from "../../../utils";
import { InSetCriterion } from "./in-set-criterion";
import { ValueCriterion } from "./value-criterion";

export class NotInSetCriterion<T extends boolean | string | number> implements ValueCriterion<T> {
    constructor(valueType: () => T, values: Iterable<T | null>) {
        this.valueType = valueType;
        this.values = new Set(values);
    }

    private readonly values: Set<T | null>;
    readonly valueType: () => T;

    static is<T extends string | number | boolean>(x: unknown, valueType: () => T): x is NotInSetCriterion<T> {
        return x instanceof NotInSetCriterion && x.valueType === valueType;
    }

    castSupportedValueType<T extends number | string | boolean>(x: unknown, valueType: () => T): NotInSetCriterion<T> | null {
        return (x as NotInSetCriterion<any>).valueType === valueType ? (x as any) : null;
    }

    getValues(): ReadonlySet<T | null> {
        return this.values;
    }

    reduce(other: ValueCriterion<T>): ValueCriterion<T>[] | false;
    reduce(other: ValueCriterion<unknown>): ValueCriterion<ReturnType<typeof other["valueType"]>>[] | false {
        if (InSetCriterion.is(other, this.valueType)) {
            const thisCast = this.castSupportedValueType(this, other.valueType);

            if (thisCast === null) {
                return false;
            }

            const copy = new Set(other.getValues());

            for (const value of other.getValues()) {
                if (!thisCast.values.has(value)) {
                    copy.delete(value);
                }
            }

            if (copy.size === other.getValues().size) {
                return false;
            } else if (copy.size === 0) {
                return [];
            } else {
                return [new InSetCriterion(other.valueType, copy)];
            }
        } else if (NotInSetCriterion.is(other, this.valueType)) {
            const remaining = subtractSets(this.values, other.values);
            if (remaining.size === 0) {
                return [];
            }

            return [new InSetCriterion(other.valueType, remaining)];
        }

        return false;
    }

    invert(): ValueCriterion<T>[] {
        return [new InSetCriterion(this.valueType, this.values)];
    }

    toString(): string {
        return `!{${Array.from(this.values).join(", ")}}`;
    }
}
