import { IEntitySchema } from "@entity-space/common";
import { EntityQuery } from "../../query/entity-query";
import { Entity } from "../entity";
import { createIdQueryFromEntities } from "./create-id-query-from-entities.fn";

export function createQueriesFromEntities(schema: IEntitySchema, entities: Entity[]): EntityQuery[] {
    const queries: EntityQuery[] = [];

    // [todo] also implement other indexes
    if (schema.hasKey()) {
        queries.push(createIdQueryFromEntities(schema, entities));
    }

    return queries;
}
