import { ObjectCriteria } from "./object-criteria";
import { ObjectCriterion } from "./object-criterion";
import { isValueCriteria, renderValueCriteria } from "./value-criterion";
import { isValuesCriteria } from "./values-criterion";

export function renderObjectCriterion(criterion: ObjectCriterion): string {
    const shards: string[] = [];

    for (const key in criterion) {
        const criteria = criterion[key];

        // [todo] this check only exists because i wanted typed ObjectCriterion to not require specifying a critera on each keyof T
        // seems kinda unclean, so revisit on how to do it better
        if (criteria === void 0) continue;

        if (isValueCriteria(criteria)) {
            shards.push(`${key}:${renderValueCriteria(criteria)}`);
        } else if (isValuesCriteria(criteria)) {
            shards.push(`${key}:NOT_IMPLEMENTED`);
        } else {
            shards.push(`${key}:${renderObjectCriteria(criteria)}`);
        }
    }

    return `{ ${shards.join(" & ")} }`;
}

export function renderObjectCriteria(criteria: ObjectCriteria): string {
    if (criteria.length === 1) {
        return renderObjectCriterion(criteria[0]);
    }

    return `(${criteria.map(renderObjectCriterion).join(" | ")})`;
}
