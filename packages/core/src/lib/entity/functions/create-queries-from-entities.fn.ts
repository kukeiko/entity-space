import { Entity } from "../../common/entity.type";
import { IEntityQuery } from "../../query/entity-query.interface";
import { IEntitySchema } from "../../schema/schema.interface";
import { createIdQueryFromEntities } from "./create-id-query-from-entities.fn";

export function createQueriesFromEntities(schema: IEntitySchema, entities: Entity[]): IEntityQuery[] {
    const queries: IEntityQuery[] = [];

    // [todo] also implement other indexes
    if (schema.hasKey()) {
        queries.push(createIdQueryFromEntities(schema, entities));
    }

    return queries;
}
