import { ValueCriterion } from "../value-criterion";
import { IsNullCriterion } from "./is-null-criterion";

export class IsNotNullCriterion extends ValueCriterion<null> {
    reduce(other: ValueCriterion): false | ValueCriterion<null>[] {
        if (other instanceof IsNotNullCriterion) {
            return [];
        }

        return false;
    }

    invert(): ValueCriterion<null>[] {
        return [new IsNullCriterion()];
    }

    toString(): string {
        return "is-not-null";
    }
}
