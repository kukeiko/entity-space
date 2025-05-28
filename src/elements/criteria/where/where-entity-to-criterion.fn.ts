import { isPrimitive } from "@entity-space/utils";
import { Criterion } from "../criterion";
import { EntityCriterion, PackedEntityCriterion } from "../entity-criterion";
import { InRangeCriterion } from "../in-range-criterion";
import { WhereEntity, WhereInRange } from "./where-entity.type";

export function whereEntityToCriterion(where: WhereEntity): Criterion | undefined {
    const criterion: PackedEntityCriterion = {};

    for (const [key, value] of Object.entries(where)) {
        if (value === undefined || (Array.isArray(value) && !value.length)) {
            continue;
        }

        if (isPrimitive(value) || (Array.isArray(value) && value.every(isPrimitive))) {
            criterion[key] = value;
        } else if ((value as WhereInRange<any>).$inRange) {
            const [from, to] = (value as WhereInRange<any>).$inRange;
            criterion[key] = new InRangeCriterion(from, to);
        } else {
            const nested = whereEntityToCriterion(value as WhereEntity);

            if (nested !== undefined) {
                criterion[key] = nested;
            }
        }
    }

    return Object.keys(criterion).length ? new EntityCriterion(criterion) : undefined;
}
