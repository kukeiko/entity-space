import { Query } from "../../query/query";
import { IEntitySchema } from "../../schema/schema.interface";
import { Entity } from "../entity";
import { createCriterionFromEntities } from "./create-criterion-from-entities.fn";

export function createQueriesFromEntities(schema: IEntitySchema, entities: Entity[]): Query[] {
    const queries: Query[] = [];

    if (schema.hasKey()) {
        const indexCriteria = createCriterionFromEntities(entities, schema.getKey().getPath());
        const query = new Query(schema, indexCriteria);
        queries.push(query);
    }

    return queries;
}
