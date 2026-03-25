import { EntitySchema } from "../../entity/entity-schema";
import { Criterion } from "../criterion";
import { EntityCriterion } from "../entity-criterion";

export function isReadonlyCriterion(schema: EntitySchema, criterion: Criterion): boolean {
    // [todo] ❌ implement OrCriterionShape
    if (!(criterion instanceof EntityCriterion)) {
        return false;
    }

    for (const [key, child] of Object.entries(criterion.getCriteria())) {
        if (schema.isRelation(key)) {
            const relatedSchema = schema.getRelation(key).getRelatedSchema();

            if (!isReadonlyCriterion(relatedSchema, child)) {
                return false;
            }
        } else if (schema.isPrimitive(key) && !schema.getPrimitive(key).isReadonly()) {
            return false;
        }
    }

    return true;
}
