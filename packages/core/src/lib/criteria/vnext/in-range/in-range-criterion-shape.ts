import { ICriterionShape, ICriterionShape$ } from "../criterion-shape.interface";
import { ICriterion } from "../criterion.interface";
import { IOrCriterion } from "../or/or-criterion.interface";
import { reshapeOrCriteria } from "../reshape-or-criteria.fn";
import { ReshapedCriterion } from "../reshaped-criterion";
import { IInNumberRangeCriterion } from "./in-number-range-criterion.interface";
import { IInStringRangeCriterion } from "./in-string-range-criterion.interface";

export class InRangeCriterionShape<T extends typeof String | typeof Number>
    implements ICriterionShape<IInNumberRangeCriterion | IInStringRangeCriterion, any>
{
    static create<T extends typeof String | typeof Number>(valueType: T): InRangeCriterionShape<T> {
        return new InRangeCriterionShape({ valueType });
    }

    constructor({ valueType }: { valueType: T }) {
        this.valueType = valueType;
    }

    readonly [ICriterionShape$] = true;
    private readonly valueType: T;

    read(criterion: IInNumberRangeCriterion | IInStringRangeCriterion) {
        throw new Error("Method not implemented.");
    }

    reshape(criterion: ICriterion): false | ReshapedCriterion<IInNumberRangeCriterion | IInStringRangeCriterion> {
        if (IInNumberRangeCriterion.is(criterion) && this.valueType === Number) {
            return new ReshapedCriterion([criterion]);
        } else if (IInStringRangeCriterion.is(criterion) && this.valueType === String) {
            return new ReshapedCriterion([criterion]);
        } else if (IOrCriterion.is(criterion)) {
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
