import { InValueCriterion } from "./in-value-criterion";

export function renderInValueCriterion(criterion: InValueCriterion): string {
    return `{${Array.from(criterion.values).join(", ")}}`;
}
