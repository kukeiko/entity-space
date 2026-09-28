import { entitiesToCriterion } from "../../criteria/functions/entities-to-criterion.fn";
import { Entity } from "../../entity/entity";
import { entityToSelection } from "../../entity/entity-to-selection.fn";
import { EntitySchema } from "../../entity/schema/entity-schema";
import { EntitySelection } from "../../selection/entity-selection";
import { EntityQuery } from "../entity-query";

export function entityToQuery(schema: EntitySchema, entity: Entity, selection?: EntitySelection): EntityQuery {
    const criterion = entitiesToCriterion([entity], schema.getIdPaths());
    selection = selection ?? entityToSelection(schema, entity);
    return new EntityQuery(schema, selection, criterion);
}
