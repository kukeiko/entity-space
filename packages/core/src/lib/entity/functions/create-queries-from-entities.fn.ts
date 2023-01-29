import { Entity } from "../../common/entity.type";
import { IEntitySchema } from "../../schema/schema.interface";
import { EntityQuery } from "../../query/entity-query";
import { createIdQueryFromEntities } from "./create-id-query-from-entities.fn";

export function createQueriesFromEntities(schema: IEntitySchema, entities: Entity[]): EntityQuery[] {
    const queries: EntityQuery[] = [];

    // [todo] also implement other indexes
    if (schema.hasKey()) {
        queries.push(createIdQueryFromEntities(schema, entities));
    }

    return queries;
}
