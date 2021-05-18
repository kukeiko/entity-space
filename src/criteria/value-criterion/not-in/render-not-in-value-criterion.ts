import { NotInValueCriterion } from "./not-in-value-criterion";

export function renderNotInValueCriterion(criterion: NotInValueCriterion): string {
    return `!{${Array.from(criterion.values).join(", ")}}`;
}
