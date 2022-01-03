import { Expansion } from "../expansion/public";
import { Query } from "../query/public";
import { createCriteriaForIndex } from "./create-criteria-for-index.fn";
import { Schema } from "./metadata/schema";
import { EntitySpaceSchemaRelation } from "./metadata/schema-json";

export function expandRelation(
    entitySchema: Schema,
    relation: EntitySpaceSchemaRelation,
    entities: any[],
    query: (query: Query) => any[],
    expansion?: Expansion
): any {
    const propertySchema = entitySchema.getPropertyByPath(relation.path);
    const toIndex = propertySchema.getIndex(relation.toIndexName);
    const fromIndex = entitySchema.getIndex(relation.fromIndexName);
    const criteria = createCriteriaForIndex(toIndex.path.slice(), fromIndex.read(entities));
    const referencedItems = query({ criteria, expansion: expansion ?? {}, model: propertySchema.getSchemaName() });

    for (const entity of entities) {
        const indexValue = fromIndex.readOne(entity);
        const matchingReferencedItems = referencedItems.filter(
            item => JSON.stringify(indexValue) === JSON.stringify(toIndex.readOne(item))
        );

        if (propertySchema.getType() === "array") {
            entity[relation.path] = matchingReferencedItems;
        } else {
            entity[relation.path] = matchingReferencedItems[0] ?? null;
        }
    }
}
