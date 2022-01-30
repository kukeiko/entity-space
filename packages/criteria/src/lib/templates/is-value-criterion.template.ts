import { isPrimitiveOrNull, Null, Primitive } from "@entity-space/utils";
import { Criterion } from "../criterion/criterion";
import { OrCriteria } from "../criterion/or/or-criteria";
import { InSetCriterion } from "../criterion/set/in-set-criterion";
import { IsValueCriterion } from "../criterion/value/is-value-criterion";
import { ICriterionTemplate } from "./criterion-template.interface";
import { RemapCriterionResult } from "./remap-criterion-result";
import { remapOrCriteria } from "./remap-or-criteria.fn";

export class IsValueCriterionTemplate<T extends Primitive | typeof Null = Primitive | typeof Null>
    implements ICriterionTemplate<IsValueCriterion<ReturnType<T>>>
{
    constructor(valueTypes: T[]) {
        this.valueTypes = valueTypes;
        this.valueMatches = (value: unknown): value is ReturnType<T> => isPrimitiveOrNull(value, valueTypes.slice());
    }

    private readonly valueTypes: readonly T[];
    private readonly valueMatches: (value: unknown) => value is ReturnType<T>;

    getValueTypes(): readonly T[] {
        return this.valueTypes;
    }

    remap(criterion: Criterion): false | RemapCriterionResult<IsValueCriterion<ReturnType<T>>> {
        if (criterion instanceof IsValueCriterion) {
            if (this.valueMatches(criterion.getValue())) {
                return new RemapCriterionResult([criterion]);
            }
        } else if (criterion instanceof InSetCriterion) {
            const values = criterion.getValuesOfType(this.valueTypes.slice());

            if (values.length > 0) {
                const valuesSet = new Set(values);
                const openValues = Array.from(criterion.getValues()).filter(value => !valuesSet.has(value));
                const open = openValues.length > 0 ? [new InSetCriterion(openValues)] : [];
                const remapped = values.map(value => new IsValueCriterion(value));

                return new RemapCriterionResult(remapped, open);
            }
        } else if (criterion instanceof OrCriteria) {
            const result = remapOrCriteria(this, criterion);

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
}
