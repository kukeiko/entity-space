import { Criterion } from "../criterion/criterion";
import { OrCriteria } from "../criterion/or/or-criteria";
import { InNumberRangeCriterion } from "../criterion/range/in-number-range-criterion";
import { InRangeCriterion } from "../criterion/range/in-range-criterion";
import { InStringRangeCriterion } from "../criterion/range/in-string-range-criterion";
import { ICriterionTemplate } from "./criterion-template.interface";
import { RemapCriterionResult } from "./remap-criterion-result";
import { remapOrCriteria } from "./remap-or-criteria.fn";

export class InRangeCriterionTemplate<T extends typeof String | typeof Number>
    implements ICriterionTemplate<InRangeCriterion<ReturnType<T>>>
{
    constructor(valueType: T) {
        this.valueType = valueType;
    }

    private readonly valueType: T;

    remap(criterion: Criterion): false | RemapCriterionResult<InRangeCriterion<ReturnType<T>>> {
        if (criterion instanceof InNumberRangeCriterion && this.valueType === Number) {
            return new RemapCriterionResult([criterion]) as RemapCriterionResult<InRangeCriterion<ReturnType<T>>>;
        } else if (criterion instanceof InStringRangeCriterion && this.valueType === String) {
            return new RemapCriterionResult([criterion]) as RemapCriterionResult<InRangeCriterion<ReturnType<T>>>;
        } else if (criterion instanceof OrCriteria) {
            const result = remapOrCriteria(this, criterion);

            if (result !== false) {
                return result;
            }
        }

        return false;
    }

    matches(criterion: Criterion): criterion is InRangeCriterion<ReturnType<T>> {
        if (this.valueType === Number) {
            return criterion instanceof InNumberRangeCriterion;
        } else if (this.valueType === String) {
            return criterion instanceof InStringRangeCriterion;
        }

        return false;
    }

    toString(): string {
        if (this.valueType === Number) {
            return `[number, number]`;
        } else {
            return `[string, string]`;
        }
    }
}
