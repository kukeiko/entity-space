import { Expansion } from "../expansion/public";
import { IEntitySchemaRelation } from "../schema/public";
import { createCriteriaForIndex } from "./create-criteria-for-index.fn";
import { Entity } from "./entity";
import { EntityReader } from "./entity-reader";
import { IEntitySource } from "./entity-source.interface";

export async function expandRelation(
    entities: Entity[],
    relation: IEntitySchemaRelation,
    source: IEntitySource,
    expansion?: Expansion
): Promise<false | Expansion> {
    const entityReader = new EntityReader();
    const relatedSchema = relation.getRelatedEntitySchema();
    // [todo] what about dictionaries?
    const isArray = relation.getProperty().getValueSchema().schemaType === "array";
    const fromIndex = relation.getFromIndex();
    const toIndex = relation.getToIndex();
    const criteria = createCriteriaForIndex(toIndex.getPath(), entityReader.readIndex(fromIndex, entities));
    const result = await source.query({ criteria, expansion: expansion ?? {}, entitySchema: relatedSchema });

    if (result === false) {
        return false;
    }

    const referencedItems = result.getEntities();

    for (const entity of entities) {
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

    return result.getQuery().expansion;
}