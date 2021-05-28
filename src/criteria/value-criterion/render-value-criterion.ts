import { renderInRange } from "./from-to";
import { renderInSet } from "./in";
import { renderNotInSet } from "./not-in";
import { ValueCriterion } from "./value-criterion";

export function renderValueCriterion(criterion: ValueCriterion): string {
    switch (criterion.op) {
        case "in":
            return renderInSet(criterion);

        case "from-to":
            return renderInRange(criterion);

        case "not-in":
            return renderNotInSet(criterion);
    }
}
