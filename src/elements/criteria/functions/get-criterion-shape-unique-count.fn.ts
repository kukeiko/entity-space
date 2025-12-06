import { isEntityPrimitiveProperty } from "../../entity/entity-primitive-property";
import { isEntityRelationProperty } from "../../entity/entity-relation-property";
import { EntitySchema } from "../../entity/entity-schema";
import { CriterionShape } from "../criterion-shape";
import { EntityCriterionShape } from "../entity-criterion-shape";
import { EqualsCriterionShape } from "../equals-criterion-shape";
import { InArrayCriterionShape } from "../in-array-criterion-shape";

export function getCriterionShapeUniqueCount(schema: EntitySchema, shape: CriterionShape): number {
    if (!(shape instanceof EntityCriterionShape)) {
        return 0;
    }

    let uniqueCount = 0;
    const idPaths = new Set(schema.getIdPaths().map(path => path.toString()));

    for (const [key, propertyShapes] of Object.entries(shape.getRequiredShapes())) {
        const property = schema.getProperty(key);

        if (isEntityPrimitiveProperty(property)) {
            let hasUnique = false;

            for (const propertyShape of propertyShapes) {
                if (propertyShape instanceof EqualsCriterionShape || propertyShape instanceof InArrayCriterionShape) {
                    idPaths.delete(key);
                    hasUnique = property.isUnique();
                    break;
                }
            }

            if (hasUnique) {
                uniqueCount++;
            }
        } else if (isEntityRelationProperty(property)) {
            // [todo] ❌ handle relations, if possible. probably need to act based on the type of relation
        }
    }

    if (schema.hasCompositeId() && !idPaths.size) {
        // [todo] ❌ needs tests
        uniqueCount++;
    }

    return uniqueCount;
}
