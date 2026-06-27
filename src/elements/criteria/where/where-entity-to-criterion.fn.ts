import { isPrimitive } from "@entity-space/utils";
import { EntitySchema } from "../../entity/entity-schema";
import { Criterion } from "../criterion";
import { EntityCriterion, PackedEntityCriterion } from "../entity-criterion";
import { EqualsCriterion } from "../equals-criterion";
import { InArrayCriterion } from "../in-array-criterion";
import { InRangeCriterion } from "../in-range-criterion";
import { NotEqualsCriterion } from "../not-equals-criterion";
import { NotInArrayCriterion } from "../not-in-array-criterion";
import { SomeCriterion } from "../some-criterion";
import {
    WhereEntity,
    WhereEquals,
    WhereInArray,
    WhereInRange,
    WhereNotEquals,
    WhereNotInArray,
} from "./where-entity.type";

export function whereEntityToCriterion(schema: EntitySchema, where: WhereEntity): Criterion | undefined {
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
        } else if ((value as WhereEquals<any>).$equals !== undefined) {
            criterion[key] = new EqualsCriterion((value as WhereEquals<any>).$equals);
        } else if ((value as WhereNotEquals<any>).$notEquals !== undefined) {
            criterion[key] = new NotEqualsCriterion((value as WhereNotEquals<any>).$notEquals);
        } else if ((value as WhereInArray<any>).$inArray !== undefined) {
            criterion[key] = new InArrayCriterion((value as WhereInArray<any>).$inArray);
        } else if ((value as WhereNotInArray<any>).$notInArray !== undefined) {
            criterion[key] = new NotInArrayCriterion((value as WhereNotInArray<any>).$notInArray);
        } else {
            const relation = schema.getRelation(key);
            const nested = whereEntityToCriterion(relation.getRelatedSchema(), value as WhereEntity);

            if (nested !== undefined) {
                if (relation.isArray()) {
                    criterion[key] = new SomeCriterion(nested);
                } else {
                    criterion[key] = nested;
                }
            }
        }
    }

    return Object.keys(criterion).length ? new EntityCriterion(criterion) : undefined;
}
