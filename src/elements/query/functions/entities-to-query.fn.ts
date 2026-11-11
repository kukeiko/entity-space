import { entitiesToCriterion } from "../../criteria/functions/entities-to-criterion.fn";
import { Entity } from "../../entity/entity";
import { EntitySchema } from "../../entity/schema/entity-schema";
import { EntitySelection } from "../../selection/entity-selection";
import { EntityQuery } from "../entity-query";

export function entitiesToQuery(
    schema: EntitySchema,
    entities: readonly Entity[],
    selection: EntitySelection,
): EntityQuery {
    // [todo] ❓ I don't think an empty array of entities should be made into a query that loads "all".
    // deleteFromCache() would, for example, remove all entities if an empty array is given. need a test for that specifically
    const criterion = entitiesToCriterion(entities, schema.getIdPaths());
    return new EntityQuery(schema, selection, criterion);
}
