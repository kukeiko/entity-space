import { ICriterionShape, ICriterionShape$ } from "../criterion-shape.interface";
import { ICriterion } from "../criterion.interface";
import { ReshapedCriterion } from "../reshaped-criterion";
import { IAllCriterion } from "./all-criterion.interface";

export class AllCriterionShape implements ICriterionShape<IAllCriterion, IAllCriterion> {
    readonly [ICriterionShape$] = true;

    read(criterion: IAllCriterion): IAllCriterion {
        return criterion;
    }

    reshape(criterion: ICriterion): false | ReshapedCriterion<IAllCriterion> {
        if (IAllCriterion.is(criterion)) {
            return new ReshapedCriterion([criterion]);
        }

        return false;
    }

    toString(): string {
        return "all";
    }
}
