import { BinaryCriterion } from "./binary-criterion";
import { IsEvenCriterion } from "./is-even-criterion";

export class IsOddCriterion extends BinaryCriterion<number> {
    inverseClass = IsEvenCriterion;

    toString(): string {
        return "odd";
    }

    matches(value: any): boolean {
        return value % 2 === 1;
    }
}
