import { BinaryCriterion } from "./binary-criterion";
import { IsFalseCriterion } from "./is-false-criterion";

export class IsTrueCriterion extends BinaryCriterion<boolean> {
    inverseClass = IsFalseCriterion;

    toString(): string {
        return "is-true";
    }

    matches(value: any): boolean {
        return value === true;
    }
}
