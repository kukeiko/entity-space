import { PrimitiveIncludingNull } from "@entity-space/utils";
import { Criteria } from "../criteria";
import { Criterion } from "../criterion";
import { CriterionTemplate } from "../criterion-template.types";
import { OrCriteriaTemplate } from "../or/or-criteria-template";
import { or } from "../or/or.fn";
import { InNumberRangeCriterion } from "../range/in-number-range-criterion";
import { inRange } from "../range/in-range.fn";
import { IsValueCriterionTemplate } from "../value/is-value-criterion-template";
import { isValue } from "../value/is-value.fn";
import { InSetCriterionTemplate } from "./in-set-criterion-template";
import { inSet } from "./in-set.fn";
import { NotInValueSetCriterion_V2 } from "./not-in-set-criterion";
import { notInSet } from "./not-in-set.fn";

export class InSetCriterion<T extends PrimitiveIncludingNull = PrimitiveIncludingNull> extends Criterion {
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

    matches(item: any): boolean {
        return this.values.has(item);
    }

    hasNumber(): this is InSetCriterion<typeof Number> {
        return true;
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
        } else if (other instanceof NotInValueSetCriterion_V2) {
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

    override remapOne(template: CriterionTemplate): [false, undefined] | [Criterion[], Criterion?] {
        // [todo] the slices are a bit annoying
        if (template instanceof InSetCriterionTemplate) {
            return [[inSet(this.getValuesOfType(template.getValueTypes().slice()))]];
        } else if (template instanceof IsValueCriterionTemplate) {
            return [this.getValuesOfType(template.getValueTypes().slice()).map(value => isValue(value))];
        } else if (
            // [todo] shouldn't this be handled by doing OrCriteria.reduceBy() ?
            template instanceof OrCriteriaTemplate &&
            template.items.some(item => item instanceof IsValueCriterionTemplate)
        ) {
            // [todo] this doesn't look right
            return [[or(Array.from(this.values).map(value => isValue(value)))]];
        }

        return [false, void 0];
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
