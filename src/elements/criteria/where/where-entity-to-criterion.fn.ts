import { isPrimitive } from "@entity-space/utils";
import { Criterion } from "../criterion";
import { EntityCriterion, PackedEntityCriterion } from "../entity-criterion";
import { InRangeCriterion } from "../in-range-criterion";
import { WhereEntity, WhereInRange } from "./where-entity.type";

export function whereEntityToCriterion(where: WhereEntity): Criterion {
    const criterion: PackedEntityCriterion = {};

    for (const [key, value] of Object.entries(where)) {
        if (isPrimitive(value) || (Array.isArray(value) && value.every(isPrimitive))) {
            criterion[key] = value;
        } else if ((value as WhereInRange<any>).$inRange) {
            const [from, to] = (value as WhereInRange<any>).$inRange;
            criterion[key] = new InRangeCriterion(from, to);
        } else {
            criterion[key] = whereEntityToCriterion(value as WhereEntity);
        }
    }

    return new EntityCriterion(criterion);
}
