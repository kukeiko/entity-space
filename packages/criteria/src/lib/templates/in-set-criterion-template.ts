import { isPrimitiveOrNull, PrimitiveIncludingNull } from "@entity-space/utils";
import { Criterion } from "../criterion/criterion";
import { OrCriteria } from "../criterion/or/or-criteria";
import { InSetCriterion } from "../criterion/set/in-set-criterion";
import { IsValueCriterion } from "../criterion/value/is-value-criterion";
import { ICriterionTemplate } from "./criterion-template.interface";
import { RemapCriterionResult } from "./remap-criterion-result";
import { remapOrCriteria } from "./remap-or-criteria.fn";

export class InSetCriterionTemplate<T extends PrimitiveIncludingNull = PrimitiveIncludingNull>
    implements ICriterionTemplate<InSetCriterion<ReturnType<T>>>
{
    constructor(valueTypes: T[]) {
        this.valueTypes = valueTypes;
        this.valueMatches = (value: unknown): value is ReturnType<T> => isPrimitiveOrNull(value, valueTypes.slice());
    }

    // [todo] get rid of this hack
    // otherwise typeof IsValueSetCriterionTemplate === typeof IsValueCriterionTemplate
    private readonly op: "in-set" = "in-set";
    private readonly valueMatches: (value: unknown) => value is ReturnType<T>;
    private readonly valueTypes: readonly T[];

    getValueTypes(): readonly T[] {
        return this.valueTypes;
    }

    remap(criterion: Criterion): false | RemapCriterionResult<InSetCriterion<ReturnType<T>>> {
        if (criterion instanceof InSetCriterion) {
            const valuesMatchingType = new Set(Array.from(criterion.getValues()).filter(this.valueMatches));

            if (valuesMatchingType.size > 0) {
                const valuesNotMatchingType = Array.from(criterion.getValues()).filter(
                    value => !valuesMatchingType.has(value)
                );

                const remapped = new InSetCriterion(valuesMatchingType);
                const open = valuesNotMatchingType.length > 0 ? [new InSetCriterion(valuesNotMatchingType)] : [];

                return new RemapCriterionResult([remapped], open);
            }
        } else if (criterion instanceof IsValueCriterion) {
            const value = criterion.getValue();

            if (this.valueMatches(value)) {
                return new RemapCriterionResult([new InSetCriterion([value])]);
            }
        } else if (criterion instanceof OrCriteria) {
            const result = remapOrCriteria(this, criterion);

            if (result !== false) {
                return result;
            }
        }

        return false;
    }
}