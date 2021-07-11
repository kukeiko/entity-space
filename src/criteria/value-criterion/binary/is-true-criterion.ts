import { ValueCriterion } from "../value-criterion";
import { IsFalseCriterion } from "./is-false-criterion";

export class IsTrueCriterion extends ValueCriterion<boolean> {
    reduce(other: ValueCriterion): false | ValueCriterion<boolean>[] {
        if (other instanceof IsTrueCriterion) {
            return [];
        }

        return false;
    }

    invert(): ValueCriterion<boolean>[] {
        return [new IsFalseCriterion()];
    }

    toString(): string {
        return "is-true";
    }
}
