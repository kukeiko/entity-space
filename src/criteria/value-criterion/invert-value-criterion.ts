import { invertInRange } from "./in-range";
import { invertInSet } from "./in/invert-in-set";
import { invertNotInSet } from "./not-in";
import { ValueCriteria } from "./value-criteria";
import { ValueCriterion } from "./value-criterion";

export function invertValueCriterion(criterion: ValueCriterion): ValueCriteria {
    switch (criterion.op) {
        case "range":
            return invertInRange(criterion);

        case "in":
            return invertInSet(criterion);

        case "not-in":
            return invertNotInSet(criterion);
    }
}
