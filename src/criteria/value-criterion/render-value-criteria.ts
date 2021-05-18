import { renderValueCriterion } from "./render-value-criterion";
import { ValueCriteria } from "./value-criteria";

export function renderValueCriteria(criteria: ValueCriteria): string {
    if (criteria.length === 1) {
        return renderValueCriterion(criteria[0]);
    }

    return `(${criteria.map(renderValueCriterion).join(" | ")})`;
}
