import { ValueCriterion } from "./value-criterion";
import { reduceInValueCriterion } from "./in";
import { reduceFromToValueCriterion } from "./from-to";
import { reduceNotInValueCriterion } from "./not-in";
import { ValueCriteria } from "./value-criteria";

export function reduceValueCriterion(a: ValueCriterion, b: ValueCriterion): ValueCriteria | false {
    switch (a.op) {
        case "in":
            return reduceInValueCriterion(a, b);

        case "from-to":
            return reduceFromToValueCriterion(a, b);

        case "not-in":
            return reduceNotInValueCriterion(a, b);
    }
}
