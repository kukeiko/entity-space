import { Entity, EntityRelationSelection, EntitySchema, isNewEntity } from "@entity-space/elements";
import { EntityChange } from "../entity-change";

export function getCreateChanges(
    schema: EntitySchema,
    entities: readonly Entity[],
    selection: EntityRelationSelection,
): EntityChange[] {
    if (!entities.length) {
        return [];
    }

    const created: EntityChange[] = [];

    if (schema.hasId()) {
        created.push(
            ...entities
                .filter(entity => isNewEntity(schema, entity))
                .map(entity => new EntityChange("create", schema, entity)),
        );
    }

    for (const [key, selected] of Object.entries(selection)) {
        const relation = schema.getRelation(key);
        const relatedSchema = relation.getRelatedSchema();
        const related = relation.readValuesFlat(entities);
        created.push(...getCreateChanges(relatedSchema, related, selected));
    }

    return created;
}
