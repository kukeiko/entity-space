import { ValueCriterion } from "./value-criterion";
import { reduceInValueCriterion } from "./reduce-in-value-criterion";

export function reduceValueCriterion(a: ValueCriterion, b: ValueCriterion): ValueCriterion | null {
    switch (a.op) {
        case "in":
            return reduceInValueCriterion(a, b);
    }

    return a;
}
