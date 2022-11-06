import { AnyCriterion } from "../criterion/any/any";
import { Criterion } from "../criterion/criterion";
import { ICriterionShape } from "./criterion-shape.interface";
import { ReshapedCriterion } from "./reshaped-criterion";

export class AnyCriterionShape implements ICriterionShape<AnyCriterion> {
    reshape(criterion: Criterion): false | ReshapedCriterion<AnyCriterion> {
        return new ReshapedCriterion([criterion]);
    }

    matches(criterion: Criterion): criterion is Criterion {
        return true;
    }

    toString(): string {
        return "any";
    }
}
