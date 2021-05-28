import { invertInRange } from "./from-to";
import { invertInSet } from "./in/invert-in-set";
import { invertNotInSet } from "./not-in";
import { ValueCriteria } from "./value-criteria";
import { ValueCriterion } from "./value-criterion";

export function invertValueCriterion(criterion: ValueCriterion): ValueCriteria {
    switch (criterion.op) {
        case "from-to":
            return invertInRange(criterion);

        case "in":
            return invertInSet(criterion);

        case "not-in":
            return invertNotInSet(criterion);
    }
}
