import { IEntitySchema } from "@entity-space/common";
import { EntityQuery } from "../../query/entity-query";
import { Entity } from "../entity";
import { createCriterionFromEntities } from "./create-criterion-from-entities.fn";

export function createIdQueryFromEntities(schema: IEntitySchema, entities: Entity[]): EntityQuery {
    const indexCriteria = createCriterionFromEntities(entities, schema.getKey().getPath());
    return new EntityQuery({ entitySchema: schema, criteria: indexCriteria });
}
