import { isPrimitiveOrNull, Null, Primitive } from "@entity-space/utils";
import { Criterion } from "../criterion/criterion";
import { OrCriteria } from "../criterion/or/or-criteria";
import { InSetCriterion } from "../criterion/set/in-set-criterion";
import { IsValueCriterion } from "../criterion/value/is-value-criterion";
import { ICriterionShape } from "./criterion-shape.interface";
import { ReshapedCriterion } from "./reshaped-criterion";
import { reshapeOrCriteria } from "./reshape-or-criteria.fn";

export class IsValueCriterionShape<T extends Primitive | typeof Null = Primitive | typeof Null>
    implements ICriterionShape<IsValueCriterion<ReturnType<T>>>
{
    constructor(valueTypes?: T[]) {
        this.valueTypes = valueTypes ?? ([Number, String, Boolean, Null] as T[]);
        this.valueMatches = (value: unknown): value is ReturnType<T> =>
            isPrimitiveOrNull(value, this.valueTypes.slice());
    }

    private readonly valueTypes: readonly T[];
    private readonly valueMatches: (value: unknown) => value is ReturnType<T>;

    getValueTypes(): readonly T[] {
        return this.valueTypes;
    }

    reshape(criterion: Criterion): false | ReshapedCriterion<IsValueCriterion<ReturnType<T>>> {
        if (criterion instanceof IsValueCriterion) {
            if (this.valueMatches(criterion.getValue())) {
                return new ReshapedCriterion([criterion]);
            }
        } else if (criterion instanceof InSetCriterion) {
            const values = criterion.getValuesOfType(this.valueTypes.slice());

            if (values.length > 0) {
                const valuesSet = new Set(values);
                const openValues = Array.from(criterion.getValues()).filter(value => !valuesSet.has(value));
                const open = openValues.length > 0 ? [new InSetCriterion(openValues)] : [];
                const remapped = values.map(value => new IsValueCriterion(value));

                return new ReshapedCriterion(remapped, open);
            }
        } else if (criterion instanceof OrCriteria) {
            const result = reshapeOrCriteria(this, criterion);

            if (result !== false) {
                return result;
            }
        }

        return false;
    }

    matches(criterion: Criterion): criterion is IsValueCriterion<ReturnType<T>> {
        if (!(criterion instanceof IsValueCriterion)) {
            return false;
        }

        return this.valueMatches(criterion.getValue());
    }

    toString(): string {
        // [todo] duplicated from in-set-criterion
        const valueTypeNames = new Set<string>(
            this.valueTypes.map(valueType => {
                if (valueType === Null) {
                    return "null";
                } else if (valueType === Number) {
                    return "number";
                } else if (valueType === String) {
                    return "string";
                } else if (valueType === Boolean) {
                    return "boolean";
                } else {
                    throw new Error(`unexpected value type ${valueType}`);
                }
            })
        );

        return `${Array.from(valueTypeNames.values()).join(" | ")}`;
    }
}
