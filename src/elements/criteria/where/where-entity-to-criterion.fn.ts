import { isPrimitive } from "@entity-space/utils";
import { EntitySchema } from "../../entity/schema/entity-schema";
import { Criterion } from "../criterion";
import { EntityCriterion, PackedEntityCriterion } from "../entity-criterion";
import { EqualsCriterion } from "../equals-criterion";
import { InArrayCriterion } from "../in-array-criterion";
import { InRangeCriterion } from "../in-range-criterion";
import { NotEqualsCriterion } from "../not-equals-criterion";
import { NotInArrayCriterion } from "../not-in-array-criterion";
import { SomeCriterion } from "../some-criterion";
import {
    isWhereEntity,
    isWhereEquals,
    isWhereInArray,
    isWhereInRange,
    isWhereNever,
    isWhereNotEquals,
    isWhereNotInArray,
    WhereEntity,
} from "./where-entity.type";

export function whereEntityToCriterion(schema: EntitySchema, where: WhereEntity): Criterion | false | undefined {
    const criterion: PackedEntityCriterion = {};

    for (const [key, value] of Object.entries(where)) {
        if (value === undefined) {
            continue;
        } else if (isWhereNever(value)) {
            return false;
        } else if (isPrimitive(value) || (Array.isArray(value) && value.every(isPrimitive))) {
            criterion[key] = value;
        } else if (isWhereInRange(value)) {
            criterion[key] = new InRangeCriterion(value.$inRange[0], value.$inRange[1]);
        } else if (isWhereEquals(value)) {
            criterion[key] = new EqualsCriterion(value.$equals);
        } else if (isWhereNotEquals(value)) {
            criterion[key] = new NotEqualsCriterion(value.$notEquals);
        } else if (isWhereInArray(value)) {
            criterion[key] = new InArrayCriterion(value.$inArray);
        } else if (isWhereNotInArray(value)) {
            criterion[key] = new NotInArrayCriterion(value.$notInArray);
        } else if (isWhereEntity(value) && schema.isRelation(key)) {
            const relation = schema.getRelation(key);
            const nested = whereEntityToCriterion(relation.getRelatedSchema(), value);

            if (nested === false) {
                return false;
            } else if (nested !== undefined) {
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
