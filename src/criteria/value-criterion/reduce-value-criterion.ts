import { ValueCriterion } from "./value-criterion";
import { reduceInValueCriterion } from "./in";
import { reduceFromToValueCriterion } from "./from-to";
import { reduceNotInValueCriterion } from "./not-in";

// [todo] could change "ValueCriterion[]" to "ValueCriteria" to be more consistent
export function reduceValueCriterion(a: ValueCriterion, b: ValueCriterion): ValueCriterion[] {
    switch (a.op) {
        case "in":
            return reduceInValueCriterion(a, b);

        case "from-to":
            return reduceFromToValueCriterion(a, b);

        case "not-in":
            return reduceNotInValueCriterion(a, b);
    }
}
