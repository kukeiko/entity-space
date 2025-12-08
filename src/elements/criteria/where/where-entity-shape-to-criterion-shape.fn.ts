import { primitiveTypeToString } from "@entity-space/utils";
import { EntitySchema } from "../../entity/entity-schema";
import { CriterionShape } from "../criterion-shape";
import { EntityCriterionShape, PackedEntityCriterionShape } from "../entity-criterion-shape";
import { EqualsCriterionShape } from "../equals-criterion-shape";
import { InArrayCriterionShape } from "../in-array-criterion-shape";
import { InRangeCriterionShape } from "../in-range-criterion-shape";
import { NotEqualsCriterionShape } from "../not-equals-criterion-shape";
import { NotInArrayCriterionShape } from "../not-in-array-criterion-shape";
import { WhereEntityShape, WherePrimitiveShape } from "./where-entity-shape.type";

function wherePrimitiveShapeToCriterionShapes(
    schema: EntitySchema,
    shape: WherePrimitiveShape,
    key: string,
): CriterionShape[] {
    const criterionShapes: CriterionShape[] = [];

    if (shape.$equals === true) {
        criterionShapes.push(new EqualsCriterionShape([schema.getPrimitive(key).getPrimitiveType()]));
    }

    if (shape.$inArray === true) {
        criterionShapes.push(new InArrayCriterionShape([schema.getPrimitive(key).getPrimitiveType()]));
    }

    if (shape.$notEquals === true) {
        criterionShapes.push(new NotEqualsCriterionShape([schema.getPrimitive(key).getPrimitiveType()]));
    }

    if (shape.$notInArray === true) {
        criterionShapes.push(new NotInArrayCriterionShape([schema.getPrimitive(key).getPrimitiveType()]));
    }

    if (shape.$inRange === true) {
        const primitiveType = schema.getPrimitive(key).getPrimitiveType();

        if (primitiveType !== Number && primitiveType !== String) {
            throw new Error(`in-range does not support primitive type ${primitiveTypeToString(primitiveType)}`);
        }

        criterionShapes.push(new InRangeCriterionShape(primitiveType));
    }

    return criterionShapes;
}

export function whereEntityShapeToCriterionShape(schema: EntitySchema, shape: WhereEntityShape): CriterionShape {
    const required: PackedEntityCriterionShape = {};
    const optional: PackedEntityCriterionShape = {};

    for (const [key, value] of Object.entries(shape)) {
        if (value === undefined) {
            continue;
        }

        if (schema.isPrimitive(key)) {
            if (value.$optional) {
                optional[key] = wherePrimitiveShapeToCriterionShapes(schema, value, key);
            } else {
                required[key] = wherePrimitiveShapeToCriterionShapes(schema, value, key);
            }
        } else {
            const relation = schema.getRelation(key);
            // [todo] ❌ should be put into "optional" if all nested shapes are optional
            required[key] = whereEntityShapeToCriterionShape(relation.getRelatedSchema(), value as WhereEntityShape);
        }
    }

    return new EntityCriterionShape(required, optional);
}
