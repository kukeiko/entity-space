import { entitiesToCriterion } from "../../criteria/functions/entities-to-criterion.fn";
import { Entity } from "../../entity/entity";
import { EntitySchema } from "../../entity/entity-schema";
import { entityToSelection } from "../../entity/entity-to-selection.fn";
import { EntityQuery } from "../entity-query";

export function entityToQuery(schema: EntitySchema, entity: Entity): EntityQuery {
    const criterion = entitiesToCriterion([entity], schema.getIdPaths());
    const selection = entityToSelection(schema, entity);
    return new EntityQuery(schema, selection, criterion);
}
