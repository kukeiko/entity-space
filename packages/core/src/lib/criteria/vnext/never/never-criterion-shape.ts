import { ICriterionShape, ICriterionShape$ } from "../criterion-shape.interface";
import { ICriterion } from "../criterion.interface";
import { ReshapedCriterion } from "../reshaped-criterion";
import { INeverCriterion } from "./never-criterion.interface";

export class NeverCriterionShape implements ICriterionShape<INeverCriterion, INeverCriterion> {
    readonly [ICriterionShape$] = true;

    read(criterion: INeverCriterion): INeverCriterion {
        return criterion;
    }

    reshape(criterion: ICriterion): false | ReshapedCriterion<INeverCriterion> {
        if (INeverCriterion.is(criterion)) {
            return new ReshapedCriterion([criterion]);
        }

        return false;
    }

    toString(): string {
        return "none";
    }
}
