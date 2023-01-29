import { isPrimitiveOrNull, Null, Primitive } from "@entity-space/utils";
import { Criterion } from "../criterion/criterion";
import { OrCriteria } from "../criterion/or/or-criteria";
import { InSetCriterion } from "../criterion/set/in-set-criterion";
import { IsValueCriterion } from "../criterion/value/is-value-criterion";
import { ICriterionShape } from "./criterion-shape.interface";
import { ReshapedCriterion } from "./reshaped-criterion";
import { reshapeOrCriteria } from "./reshape-or-criteria.fn";

export class InSetCriterionShape<T extends Primitive | typeof Null = Primitive | typeof Null>
    implements ICriterionShape<InSetCriterion<ReturnType<T>>>
{
    constructor(valueTypes: T[]) {
        this.valueTypes = valueTypes;
    }

    // [todo] get rid of this hack
    // otherwise typeof IsSetCriterionTemplate === typeof IsValueCriterionTemplate
    // [todo] being able to distinguish between "typeof IsSetCriterionTemplate" and "typeof IsValueCriterionTemplate"
    // might no longer be necessary, as "instanced-criterion-template" has been simplified
    private readonly op: "in-set" = "in-set";

    private valueMatches(value: unknown): value is ReturnType<T> {
        const valueTypes = this.valueTypes;

        if (valueTypes.length > 0) {
            return isPrimitiveOrNull(value, valueTypes.slice());
        } else {
            return isPrimitiveOrNull(value);
        }
    }
    private readonly valueTypes: readonly T[];

    getValueTypes(): readonly T[] {
        return this.valueTypes;
    }

    reshape(criterion: Criterion): false | ReshapedCriterion<InSetCriterion<ReturnType<T>>> {
        if (criterion instanceof InSetCriterion) {
            const valuesMatchingType = new Set(
                Array.from(criterion.getValues()).filter(value => this.valueMatches(value))
            );

            if (valuesMatchingType.size > 0) {
                const valuesNotMatchingType = Array.from(criterion.getValues()).filter(
                    value => !valuesMatchingType.has(value)
                );

                const remapped = new InSetCriterion(valuesMatchingType);
                const open = valuesNotMatchingType.length > 0 ? [new InSetCriterion(valuesNotMatchingType)] : [];

                return new ReshapedCriterion([remapped], open);
            }
        } else if (criterion instanceof IsValueCriterion) {
            const value = criterion.getValue();

            if (this.valueMatches(value)) {
                return new ReshapedCriterion([new InSetCriterion([value])]);
            }
        } else if (criterion instanceof OrCriteria) {
            const result = reshapeOrCriteria(this, criterion);

            if (result !== false) {
                return result;
            }
        }

        return false;
    }

    matches(criterion: Criterion): criterion is InSetCriterion<ReturnType<T>> {
        if (!(criterion instanceof InSetCriterion)) {
            return false;
        }

        return Array.from(criterion.getValues()).every(value => this.valueMatches(value));
    }

    toString(): string {
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

        return `{ ${Array.from(valueTypeNames.values()).join(", ")} }`;
    }
}
