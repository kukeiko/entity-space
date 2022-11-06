import { Criterion } from "../criterion/criterion";
import { OrCriteria } from "../criterion/or/or-criteria";
import { InNumberRangeCriterion } from "../criterion/range/in-number-range-criterion";
import { InRangeCriterion } from "../criterion/range/in-range-criterion";
import { InStringRangeCriterion } from "../criterion/range/in-string-range-criterion";
import { ICriterionShape } from "./criterion-shape.interface";
import { ReshapedCriterion } from "./reshaped-criterion";
import { reshapeOrCriteria } from "./remap-or-criteria.fn";

export class InRangeCriterionShape<T extends typeof String | typeof Number>
    implements ICriterionShape<InRangeCriterion<ReturnType<T>>>
{
    constructor(valueType: T) {
        this.valueType = valueType;
    }

    private readonly valueType: T;

    reshape(criterion: Criterion): false | ReshapedCriterion<InRangeCriterion<ReturnType<T>>> {
        if (criterion instanceof InNumberRangeCriterion && this.valueType === Number) {
            return new ReshapedCriterion([criterion]) as ReshapedCriterion<InRangeCriterion<ReturnType<T>>>;
        } else if (criterion instanceof InStringRangeCriterion && this.valueType === String) {
            return new ReshapedCriterion([criterion]) as ReshapedCriterion<InRangeCriterion<ReturnType<T>>>;
        } else if (criterion instanceof OrCriteria) {
            const result = reshapeOrCriteria(this, criterion);

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
