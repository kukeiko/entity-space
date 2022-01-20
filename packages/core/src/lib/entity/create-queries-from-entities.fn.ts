import { Query } from "../query/public";
import { IEntitySchema } from "../schema/public";
import { createCriteriaForIndex } from "./create-criteria-for-index.fn";
import { Entity } from "./entity";
import { EntityReader } from "./entity-reader";

export function createQueriesFromEntities(schema: IEntitySchema, entities: Entity[]): Query[] {
    const reader = new EntityReader();
    const queries: Query[] = [];

    for (const index of schema.getIndexesIncludingKey()) {
        const indexValues = reader.readIndex(index, entities);
        const indexCriteria = createCriteriaForIndex(index.getPath(), indexValues);

        const query: Query = {
            criteria: indexCriteria,
            entitySchema: schema,
            expansion: {},
        };

        queries.push(query);
    }

    return queries;
}
