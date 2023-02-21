import { ICriterionShape, ICriterionShape$ } from "./criterion-shape.interface";
import { ICriterion } from "./criterion.interface";
import { ReshapedCriterion } from "./reshaped-criterion";

export class AnyCriterionShape implements ICriterionShape {
    readonly [ICriterionShape$] = true;

    reshape(criterion: ICriterion): false | ReshapedCriterion {
        return new ReshapedCriterion([criterion]);
    }

    toString(): string {
        return "any";
    }
}
