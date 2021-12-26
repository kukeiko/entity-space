import { BinaryCriterion } from "./binary-criterion";
import { IsNullCriterion } from "./is-null-criterion";

export class IsNotNullCriterion extends BinaryCriterion<null> {
    inverseClass = IsNullCriterion;

    toString(): string {
        return "is-not-null";
    }

    matches(value: any): boolean {
        return value !== null;
    }
}
