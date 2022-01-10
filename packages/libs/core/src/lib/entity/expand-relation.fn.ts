import { Expansion } from "../expansion/public";
import { Query } from "../query/public";
import { EntitySpaceSchemaRelation_Old } from "../schema/entity-space-schema";
import { Schema } from "../schema/schema";
import { createCriteriaForIndex } from "./create-criteria-for-index.fn";

export function expandRelation(
    entitySchema: Schema,
    relation: EntitySpaceSchemaRelation_Old,
    entities: any[],
    query: (query: Query) => any[],
    expansion?: Expansion
): any {
    const propertySchema = entitySchema.getPropertyByPath(relation.path);
    const toIndex = propertySchema.getIndex(relation.to);
    const fromIndex = entitySchema.getIndex(relation.from);
    const criteria = createCriteriaForIndex(toIndex.path.slice(), fromIndex.read(entities));
    const referencedItems = query({ criteria, expansion: expansion ?? {}, model: propertySchema.getNominalSchemaId() });

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
