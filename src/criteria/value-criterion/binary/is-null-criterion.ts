import { ValueCriterion } from "../value-criterion";
import { IsNotNullCriterion } from "./is-not-null-criterion";

export class IsNullCriterion extends ValueCriterion<null> {
    reduce(other: ValueCriterion): false | ValueCriterion<null>[] {
        if (other instanceof IsNullCriterion) {
            return [];
        }

        return false;
    }

    invert(): ValueCriterion<null>[] {
        return [new IsNotNullCriterion()];
    }

    toString(): string {
        return "is-null";
    }
}
