import { Query } from "../../query/query";
import { IEntitySchema } from "../../schema/schema.interface";
import { Entity } from "../entity";
import { createCriterionFromEntities } from "./create-criterion-from-entities.fn";

export function createIdQueryFromEntities(schema: IEntitySchema, entities: Entity[]): Query {
    const indexCriteria = createCriterionFromEntities(entities, schema.getKey().getPath());
    return new Query({ entitySchema: schema, criteria: indexCriteria });
}
