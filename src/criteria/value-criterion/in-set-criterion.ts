import { InRangeCriterion } from "./in-range-criterion";
import { NotInSetCriterion } from "./not-in-set-criterion";
import { ValueCriterion } from "./value-criterion";

export class InSetCriterion<T extends boolean | string | number> implements ValueCriterion<T> {
    constructor(valueType: () => T, values: Iterable<T | null>) {
        this.valueType = valueType;
        this.values = new Set(values);
    }

    private readonly values: Set<T | null>;

    static is<T extends string | number | boolean>(x: unknown, valueType: () => T): x is InSetCriterion<T> {
        return x instanceof InSetCriterion && x.valueType === valueType;
    }

    valueType: () => T;

    castSupportedValueType<T extends number | string | boolean>(x: unknown, valueType: () => T): InSetCriterion<T> | null {
        return (x as InSetCriterion<any>).valueType === valueType ? (x as any) : null;
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
        } else if (NotInSetCriterion.is(other, this.valueType)) {
            const merged = new Set([...other.getValues(), ...this.values]);

            return [new NotInSetCriterion(other.valueType, merged)];
        } else if (InRangeCriterion.supportsValueType(this.valueType) && InRangeCriterion.is(other, this.valueType)) {
            const thisCast = this.castSupportedValueType(this, other.valueType);

            if (thisCast === null) {
                return false;
            }

            const selfValues = thisCast.getValues();
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
                return [new InRangeCriterion(other.valueType, [otherFrom?.value, otherTo?.value], [otherFrom?.op === ">=", otherTo?.op === "<="])];
            }
        }

        return false;
    }

    invert(): ValueCriterion<T>[] {
        return [new NotInSetCriterion(this.valueType, this.values)];
    }

    toString(): string {
        return `{${Array.from(this.values).join(", ")}}`;
    }
}
