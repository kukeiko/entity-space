import { ICriterionShape, ICriterionShape$ } from "./criterion-shape.interface";
import { ICriterion } from "./criterion.interface";
import { ReshapedCriterion } from "./reshaped-criterion";

export class AnyCriterionShape implements ICriterionShape<ICriterion, ICriterion> {
    readonly [ICriterionShape$] = true;

    read(criterion: ICriterion): ICriterion {
        return criterion;
    }

    reshape(criterion: ICriterion): false | ReshapedCriterion<ICriterion> {
        return new ReshapedCriterion([criterion]);
    }

    toString(): string {
        return "any";
    }
}
