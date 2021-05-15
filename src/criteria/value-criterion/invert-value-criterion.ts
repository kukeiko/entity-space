import { invertFromToValueCriterion } from "./from-to";
import { invertInValueCriterion } from "./in/invert-in-value-criterion";
import { invertNotInValueCriterion } from "./not-in";
import { ValueCriteria } from "./value-criteria";
import { ValueCriterion } from "./value-criterion";

export function invertValueCriterion(criterion: ValueCriterion): ValueCriteria {
    switch (criterion.op) {
        case "from-to":
            return invertFromToValueCriterion(criterion);

        case "in":
            return invertInValueCriterion(criterion);

        case "not-in":
            return invertNotInValueCriterion(criterion);
    }
}
