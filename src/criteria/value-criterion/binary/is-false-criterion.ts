import { ValueCriterion } from "../value-criterion";
import { IsTrueCriterion } from "./is-true-criterion";

export class IsFalseCriterion extends ValueCriterion<boolean> {
    reduce(other: ValueCriterion): false | ValueCriterion<boolean>[] {
        if (other instanceof IsFalseCriterion) {
            return [];
        }

        return false;
    }

    invert(): ValueCriterion<boolean>[] {
        return [new IsTrueCriterion()];
    }

    toString(): string {
        return "is-false";
    }
}
