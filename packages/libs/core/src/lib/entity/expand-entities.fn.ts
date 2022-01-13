import { Expansion } from "../expansion/public";
import { Query } from "../query/public";
import { EntitySchemaRelation } from "../schema/public";
import { createCriteriaForIndex } from "./create-criteria-for-index.fn";
import { Entity } from "./entity";
import { UnbakedEntityReader } from "./unbaked-entity-reader";

export function expandEntities(
    entities: Entity[],
    relation: EntitySchemaRelation,
    query: (query: Query) => Entity[],
    expansion?: Expansion
): void {
    const entityReader = new UnbakedEntityReader();
    const relatedSchema = relation.getRelatedSchema();
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
            entity[relation.getPath()] = matchingReferencedItems;
        } else {
            entity[relation.getPath()] = matchingReferencedItems[0] ?? null;
        }
    }
}
