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
    WhereEntity,
    WhereEquals,
    WhereInArray,
    WhereInRange,
    WhereNotEquals,
    WhereNotInArray,
} from "./where-entity.type";

export function whereEntityToCriterion(schema: EntitySchema, where: WhereEntity): Criterion | false | undefined {
    const criterion: PackedEntityCriterion = {};

    for (const [key, value] of Object.entries(where)) {
        if (value === undefined) {
            continue;
        } else if (Array.isArray(value) && !value.length) {
            return false;
        }

        if (isPrimitive(value) || (Array.isArray(value) && value.every(isPrimitive))) {
            criterion[key] = value;
        } else if ((value as WhereInRange<any>).$inRange) {
            const [from, to] = (value as WhereInRange<any>).$inRange;

            if (!(from === undefined && to === undefined)) {
                criterion[key] = new InRangeCriterion(from, to);
            }
        } else if ((value as WhereEquals<any>).$equals !== undefined) {
            criterion[key] = new EqualsCriterion((value as WhereEquals<any>).$equals);
        } else if ((value as WhereNotEquals<any>).$notEquals !== undefined) {
            criterion[key] = new NotEqualsCriterion((value as WhereNotEquals<any>).$notEquals);
        } else if ((value as WhereInArray<any>).$inArray !== undefined) {
            if (!(value as WhereInArray<any>).$inArray.length) {
                return false;
            }
            criterion[key] = new InArrayCriterion((value as WhereInArray<any>).$inArray);
        } else if ((value as WhereNotInArray<any>).$notInArray !== undefined) {
            criterion[key] = new NotInArrayCriterion((value as WhereNotInArray<any>).$notInArray);
        } else {
            const relation = schema.getRelation(key);
            const nested = whereEntityToCriterion(relation.getRelatedSchema(), value as WhereEntity);

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
