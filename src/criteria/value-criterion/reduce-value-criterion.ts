import { ValueCriterion } from "./value-criterion";
import { reduceInValueCriterion } from "./in/reduce-in-value-criterion";
import { reduceFromToValueCriterion } from "./from-to/reduce-from-to-value-criterion";
import { reduceNotInValueCriterion } from "./not-in/reduce-not-in-value-criterion";

export function reduceValueCriterion(a: ValueCriterion, b: ValueCriterion): ValueCriterion | null {
    switch (a.op) {
        case "in":
            return reduceInValueCriterion(a, b);

        case "from-to":
            return reduceFromToValueCriterion(a, b);

        case "not-in":
            return reduceNotInValueCriterion(a, b);
    }
}
