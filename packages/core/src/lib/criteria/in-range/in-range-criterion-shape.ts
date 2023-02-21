import { ICriterionShape, ICriterionShape$ } from "../criterion-shape.interface";
import { ICriterion } from "../criterion.interface";
import { IEntityCriteriaTools } from "../entity-criteria-tools.interface";
import { reshapeOrCriteria } from "../reshape-or-criteria.fn";
import { ReshapedCriterion } from "../reshaped-criterion";
import { IInNumberRangeCriterion } from "./in-number-range-criterion.interface";
import { IInStringRangeCriterion } from "./in-string-range-criterion.interface";

export class InRangeCriterionShape<T extends typeof String | typeof Number>
    implements ICriterionShape<IInNumberRangeCriterion | IInStringRangeCriterion, any>
{
    constructor({ valueType, tools }: { valueType: T; tools: IEntityCriteriaTools }) {
        this.valueType = valueType;
        this.tools = tools;
    }

    readonly [ICriterionShape$] = true;
    private readonly valueType: T;
    private readonly tools: IEntityCriteriaTools;

    reshape(criterion: ICriterion): false | ReshapedCriterion<IInNumberRangeCriterion | IInStringRangeCriterion> {
        if (this.tools.isInNumberRangeCriterion(criterion) && this.valueType === Number) {
            return new ReshapedCriterion([criterion]);
        } else if (this.tools.isInStringRangeCriterion(criterion) && this.valueType === String) {
            return new ReshapedCriterion([criterion]);
        } else if (this.tools.isOrCriterion(criterion)) {
            const result = reshapeOrCriteria(this, criterion);

            if (result !== false) {
                return result;
            }
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
