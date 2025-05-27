import { Criterion } from "../criterion";
import { EntityCriterion } from "../entity-criterion";
import { EqualsCriterion } from "../equals-criterion";
import { InArrayCriterion } from "../in-array-criterion";
import { InRangeCriterion } from "../in-range-criterion";
import { WhereEntityShapeInstance } from "./where-entity-shape-instance.type";
import { WhereEntityShape, WherePrimitiveShape } from "./where-entity-shape.type";

function isWherePrimitiveShape(
    shape: Partial<WherePrimitiveShape> | WhereEntityShape,
): shape is Partial<WherePrimitiveShape> {
    const keys: (keyof WherePrimitiveShape)[] = ["$equals", "$inArray", "$inRange", "$notEquals", "$notInArray"];

    return keys.some(key => shape[key] === true);
}

function createDefault(shape: WhereEntityShape): WhereEntityShapeInstance {
    const instance: WhereEntityShapeInstance = {};

    for (const [key, value] of Object.entries(shape)) {
        if (value === undefined || isWherePrimitiveShape(value)) {
            continue;
        }

        instance[key] = createDefault(value);
    }

    return instance;
}

export function criterionToWhereEntityShapeInstance(
    shape: WhereEntityShape,
    criterion: Criterion,
): WhereEntityShapeInstance {
    if (!(criterion instanceof EntityCriterion)) {
        throw new Error("not yet implemented");
    }

    const whereEntityShapeInstance = createDefault(shape);

    for (const [key, value] of Object.entries(criterion.getCriteria())) {
        const wherePropertyShape = shape[key];

        if (wherePropertyShape === undefined) {
            continue;
        }

        if (value instanceof EntityCriterion) {
            whereEntityShapeInstance[key] = criterionToWhereEntityShapeInstance(
                wherePropertyShape as WhereEntityShape,
                value,
            );
        } else if (value instanceof EqualsCriterion) {
            if (wherePropertyShape.$equals === true) {
                whereEntityShapeInstance[key] = { type: "$equals", value: value.getValue() } as any;
            }
        } else if (value instanceof InArrayCriterion) {
            if (wherePropertyShape.$inArray === true) {
                whereEntityShapeInstance[key] = { type: "$inArray", value: value.getValues() } as any;
            }
        } else if (value instanceof InRangeCriterion) {
            if (wherePropertyShape.$inRange === true) {
                whereEntityShapeInstance[key] = {
                    type: "$inRange",
                    value: [value.getFrom()?.value, value.getTo()?.value],
                } as any;
            }
        }
    }

    return whereEntityShapeInstance;
}
