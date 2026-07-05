import { Criterion } from "../criterion";
import { EntityCriterion } from "../entity-criterion";
import { EqualsCriterion } from "../equals-criterion";
import { InArrayCriterion } from "../in-array-criterion";
import { InRangeCriterion } from "../in-range-criterion";
import { NotEqualsCriterion } from "../not-equals-criterion";
import { NotInArrayCriterion } from "../not-in-array-criterion";
import { SomeCriterion } from "../some-criterion";
import { isWherePrimitiveShape, WhereEntityShape } from "./where-entity-shape.type";
import {
    WhereEntity,
    WhereEquals,
    WhereInArray,
    WhereInRange,
    WhereNotEquals,
    WhereNotInArray,
} from "./where-entity.type";

function createDefault(shape: WhereEntityShape): WhereEntity {
    const instance: WhereEntity = {};

    for (const [key, value] of Object.entries(shape)) {
        if (value === undefined || isWherePrimitiveShape(value)) {
            continue;
        }

        instance[key] = createDefault(value);
    }

    return instance;
}

export function criterionToWhereEntity(shape: WhereEntityShape, criterion?: Criterion): WhereEntity {
    if (criterion !== undefined && !(criterion instanceof EntityCriterion)) {
        throw new Error("not yet implemented");
    }

    const whereEntity = createDefault(shape);

    if (criterion === undefined) {
        return whereEntity;
    }

    for (const [key, value] of Object.entries(criterion.getCriteria())) {
        const wherePropertyShape = shape[key];

        if (wherePropertyShape === undefined) {
            continue;
        } else if (isWherePrimitiveShape(wherePropertyShape)) {
            if (wherePropertyShape.$equals === true && value instanceof EqualsCriterion) {
                whereEntity[key] = { $equals: value.getValue() } satisfies WhereEquals;
            } else if (wherePropertyShape.$notEquals === true && value instanceof NotEqualsCriterion) {
                whereEntity[key] = { $notEquals: value.getValue() } satisfies WhereNotEquals;
            } else if (wherePropertyShape.$inArray && value instanceof InArrayCriterion) {
                whereEntity[key] = { $inArray: value.getValues().slice() } satisfies WhereInArray;
            } else if (wherePropertyShape.$notInArray && value instanceof NotInArrayCriterion) {
                whereEntity[key] = { $notInArray: value.getValues().slice() } satisfies WhereNotInArray;
            } else if (wherePropertyShape.$inRange === true && value instanceof InRangeCriterion) {
                whereEntity[key] = {
                    $inRange: [value.getFrom()?.value, value.getTo()?.value],
                } satisfies WhereInRange;
            }
        } else {
            if (value instanceof EntityCriterion) {
                whereEntity[key] = criterionToWhereEntity(wherePropertyShape, value);
            } else if (value instanceof SomeCriterion) {
                whereEntity[key] = criterionToWhereEntity(wherePropertyShape, value.getCriterion());
            }
        }
    }

    return whereEntity;
}
