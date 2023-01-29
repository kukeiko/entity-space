import { Entity } from "../../common/entity.type";
import { IEntitySchema } from "../../common/schema/schema.interface";
import { EntityQuery } from "../../query/entity-query";
import { createCriterionFromEntities } from "./create-criterion-from-entities.fn";

export function createIdQueryFromEntities(schema: IEntitySchema, entities: Entity[]): EntityQuery {
    const indexCriteria = createCriterionFromEntities(entities, schema.getKey().getPath());
    return new EntityQuery({ entitySchema: schema, criteria: indexCriteria });
}
