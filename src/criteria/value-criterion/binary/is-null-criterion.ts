import { BinaryCriterion } from "./binary-criterion";
import { IsNotNullCriterion } from "./is-not-null-criterion";

export class IsNullCriterion extends BinaryCriterion<null> {
    inverseClass = IsNotNullCriterion;

    toString(): string {
        return "is-null";
    }
}
