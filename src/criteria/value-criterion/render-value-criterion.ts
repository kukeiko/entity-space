import { renderFromToValueCriterion } from "./from-to";
import { renderInValueCriterion } from "./in";
import { renderNotInValueCriterion } from "./not-in";
import { ValueCriterion } from "./value-criterion";

export function renderValueCriterion(criterion: ValueCriterion): string {
    switch (criterion.op) {
        case "in":
            return renderInValueCriterion(criterion);

        case "from-to":
            return renderFromToValueCriterion(criterion);

        case "not-in":
            return renderNotInValueCriterion(criterion);
    }
}
