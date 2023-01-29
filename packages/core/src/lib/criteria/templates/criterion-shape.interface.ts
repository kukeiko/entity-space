import { Criterion } from "../criterion/criterion";
import { ReshapedCriterion } from "./reshaped-criterion";

export interface ICriterionShape<T extends Criterion = Criterion> {
    reshape(criterion: Criterion): false | ReshapedCriterion<T>;
    matches(criterion: Criterion): criterion is T;
    toString(): string;
}
