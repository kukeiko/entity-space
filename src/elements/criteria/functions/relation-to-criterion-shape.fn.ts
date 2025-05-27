import { writePath } from "@entity-space/utils";
import { EntityRelationProperty } from "../../entity/entity-relation-property";
import { CriterionShape } from "../criterion-shape";
import { EntityCriterionShape, PackedEntityCriterionShape } from "../entity-criterion-shape";
import { EqualsCriterionShape } from "../equals-criterion-shape";
import { InArrayCriterionShape } from "../in-array-criterion-shape";

export function relationToCriterionShape(relation: EntityRelationProperty): CriterionShape {
    const leadingPaths = relation.getJoinTo().slice(0, -1);
    const lastPath = relation.getJoinTo().at(-1)!;
    const bag: PackedEntityCriterionShape = {};
    const relatedSchema = relation.getRelatedSchema();

    for (const leadingPath of leadingPaths) {
        const primitiveType = relatedSchema.getPrimitive(leadingPath.toString()).getPrimitiveType();
        writePath(leadingPath, bag, new EqualsCriterionShape([primitiveType]));
    }

    const primitiveType = relatedSchema.getPrimitive(lastPath.toString()).getPrimitiveType();
    writePath(lastPath, bag, new InArrayCriterionShape([primitiveType]));

    return new EntityCriterionShape(bag);
}
