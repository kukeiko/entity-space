import { NotInSetCriterion } from "./not-in-set-criterion";

export function renderNotInSet(criterion: NotInSetCriterion): string {
    return `!{${Array.from(criterion.values).join(", ")}}`;
}
