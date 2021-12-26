import { BinaryCriterion } from "./binary-criterion";
import { IsTrueCriterion } from "./is-true-criterion";

export class IsFalseCriterion extends BinaryCriterion<boolean> {
    inverseClass = IsTrueCriterion;

    toString(): string {
        return "is-false";
    }

    matches(value: any): boolean {
        return value === false;
    }
}
