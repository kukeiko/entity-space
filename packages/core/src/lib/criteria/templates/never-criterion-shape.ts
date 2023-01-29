import { AnyCriterion } from "../criterion/any/any";
import { Criterion } from "../criterion/criterion";
import { NeverCriterion } from "../criterion/never/never";
import { ICriterionShape } from "./criterion-shape.interface";
import { ReshapedCriterion } from "./reshaped-criterion";

// [todo] shouldn't it be NeverCriterion instead of AnyCriterion?
export class NeverCriterionShape implements ICriterionShape<AnyCriterion> {
    reshape(criterion: Criterion): false | ReshapedCriterion<AnyCriterion> {
        if (criterion instanceof NeverCriterion) {
            return new ReshapedCriterion([criterion]);
        }

        return false;
    }

    matches(criterion: Criterion): criterion is Criterion {
        return criterion instanceof NeverCriterion;
    }

    toString(): string {
        return "never";
    }
}
