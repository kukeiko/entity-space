import { Expansion } from "../expansion/public";
import { Query } from "../query/public";
import { IEntitySchemaRelation } from "../schema/public";
import { createCriteriaForIndex } from "./create-criteria-for-index.fn";
import { Entity } from "./entity";
import { EntityReader } from "./entity-reader";

export function expandEntities(
    entities: Entity[],
    relation: IEntitySchemaRelation,
    query: (query: Query) => Entity[],
    expansion?: Expansion
): void {
    const entityReader = new EntityReader();
    const relatedSchema = relation.getRelatedEntitySchema();
    // [todo] what about dictionaries?
    const isArray = relation.getProperty().getValueSchema().schemaType === "array";
    const fromIndex = relation.getFromIndex();
    const toIndex = relation.getToIndex();
    const criteria = createCriteriaForIndex(toIndex.getPath(), entityReader.readIndex(fromIndex, entities));
    const referencedItems = query({ criteria, expansion: expansion ?? {}, model: relatedSchema.getId() });

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
}
