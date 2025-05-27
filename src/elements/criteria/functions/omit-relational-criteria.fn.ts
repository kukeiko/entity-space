import { isDefined } from "@entity-space/utils";
import { EntitySchema } from "../../entity/entity-schema";
import { AndCriterion } from "../and-criterion";
import { Criterion } from "../criterion";
import { EntityCriterion } from "../entity-criterion";
import { OrCriterion } from "../or-criterion";

export function omitRelationalCriteria(criterion: Criterion, schema: EntitySchema): Criterion | undefined {
    if (criterion instanceof OrCriterion || criterion instanceof AndCriterion) {
        const omittedCriteria = criterion
            .getCriteria()
            .map(criterion => omitRelationalCriteria(criterion, schema))
            .filter(isDefined);

        if (!omittedCriteria.length) {
            return undefined;
        } else if (omittedCriteria.length === 1) {
            return omittedCriteria[1];
        } else if (criterion instanceof OrCriterion) {
            return new OrCriterion(omittedCriteria);
        } else {
            return new AndCriterion(omittedCriteria);
        }
    } else if (criterion instanceof EntityCriterion) {
        const criteria = criterion.getCriteria();
        const omitted: Record<string, Criterion> = {};

        for (const [key, criterion] of Object.entries(criteria)) {
            if (!schema.isRelation(key)) {
                omitted[key] = criterion;
            } else if (!schema.getRelation(key).isEmbedded()) {
                continue;
            } else {
                const omittedCriterion = omitRelationalCriteria(criterion, schema.getRelation(key).getRelatedSchema());

                if (omittedCriterion) {
                    omitted[key] = omittedCriterion;
                }
            }
        }

        return Object.keys(omitted).length ? new EntityCriterion(omitted) : undefined;
    } else {
        return criterion;
    }
}
