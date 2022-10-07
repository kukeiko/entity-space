import { Query } from "../../query/query";
import { IEntitySchema } from "../../schema/schema.interface";
import { Entity } from "../entity";
import { createIdQueryFromEntities } from "./create-id-query-from-entities.fn";

export function createQueriesFromEntities(schema: IEntitySchema, entities: Entity[]): Query[] {
    const queries: Query[] = [];

    // [todo] also implement other indexes
    if (schema.hasKey()) {
        queries.push(createIdQueryFromEntities(schema, entities));
    }

    return queries;
}
