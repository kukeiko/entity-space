import { ValueCriterion } from "./value-criterion";
import { reduceInSet } from "./in";
import { reduceInRange } from "./from-to";
import { reduceNotInSet } from "./not-in";
import { ValueCriteria } from "./value-criteria";

export function reduceValueCriterion(a: ValueCriterion, b: ValueCriterion): ValueCriteria | false {
    switch (a.op) {
        case "in":
            return reduceInSet(a, b);

        case "from-to":
            return reduceInRange(a, b);

        case "not-in":
            return reduceNotInSet(a, b);
    }
}
