import { ICriterionShape, ICriterionShape$ } from "../criterion-shape.interface";
import { ICriterion } from "../criterion.interface";
import { ReshapedCriterion } from "../reshaped-criterion";
import { INoneCriterion } from "./none-criterion.interface";

export class NoneCriterionShape implements ICriterionShape<INoneCriterion, INoneCriterion> {
    readonly [ICriterionShape$] = true;

    read(criterion: INoneCriterion): INoneCriterion {
        return criterion;
    }

    reshape(criterion: ICriterion): false | ReshapedCriterion<INoneCriterion> {
        if (INoneCriterion.is(criterion)) {
            return new ReshapedCriterion([criterion]);
        }

        return false;
    }

    toString(): string {
        return "none";
    }
}
