import { ExpansionObject } from "../../expansion/public";
import { Query } from "../../query/query";
import { IEntitySchemaRelation } from "../../schema/public";
import { Entity } from "../entity";
import { EntityReader } from "../entity-reader";
import { IEntitySource } from "../entity-source.interface";
import { createCriterionFromEntities } from "./create-criterion-from-entities.fn";

export async function expandRelation(
    entities: Entity[],
    relation: IEntitySchemaRelation,
    source: IEntitySource,
    expansion?: ExpansionObject
): Promise<false | ExpansionObject> {
    const entityReader = new EntityReader();
    const relatedSchema = relation.getRelatedEntitySchema();
    // [todo] what about dictionaries?
    const isArray = relation.getProperty().getValueSchema().schemaType === "array";
    const fromIndex = relation.getFromIndex();
    const toIndex = relation.getToIndex();
    const criteria = createCriterionFromEntities(entities, fromIndex.getPath(), toIndex.getPath());

    const query = new Query(relatedSchema, criteria, expansion ?? {});
    const result = await source.query(query);

    if (result === false) {
        return false;
    }

    // [todo] fix
    const queried = result[0];
    const referencedItems = queried.getEntities();

    for (const entity of entities) {
        // [todo] use ComplexKeyMap
        const indexValue = entityReader.readIndexFromOne(fromIndex, entity);
        const matchingReferencedItems = referencedItems.filter(
            entity => JSON.stringify(indexValue) === JSON.stringify(entityReader.readIndexFromOne(toIndex, entity))
        );

        if (isArray) {
            entity[relation.getPropertyName()] = matchingReferencedItems;
        } else {
            entity[relation.getPropertyName()] = matchingReferencedItems[0] ?? null;
        }
    }

    return queried.getQuery().getExpansionObject();
}