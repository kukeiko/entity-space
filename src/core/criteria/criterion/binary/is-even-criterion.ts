import { BinaryCriterion } from "./binary-criterion";
import { IsOddCriterion } from "./is-odd-criterion";

export class IsEvenCriterion extends BinaryCriterion<number> {
    inverseClass = IsOddCriterion;

    toString(): string {
        return "is-even";
    }
}
