import { InSetCriterion } from "./in-set-criterion";

export function renderInSet(criterion: InSetCriterion): string {
    return `{${Array.from(criterion.values).join(", ")}}`;
}
