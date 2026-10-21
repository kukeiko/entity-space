import { EntitySchema } from "../../entity/schema/entity-schema";
import { AndCriterion } from "../and-criterion";
import { Criterion } from "../criterion";
import { EntityCriterion } from "../entity-criterion";
import { OrCriterion } from "../or-criterion";

/**
 * Returns true if the criterion only filters on readonly properties of an entity.
 */
export function isReadonlyCriterion(schema: EntitySchema, criterion: Criterion): boolean {
    if (criterion instanceof OrCriterion || criterion instanceof AndCriterion) {
        return criterion.getCriteria().every(criterion => isReadonlyCriterion(schema, criterion));
    } else if (!(criterion instanceof EntityCriterion)) {
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
