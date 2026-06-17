import { Entity, EntityRelationSelection, EntitySchema, toEntityPairs } from "@entity-space/elements";
import { isEqual } from "lodash";

export function isEntityUpdateEqual(
    schema: EntitySchema,
    a: Entity,
    b: Entity,
    selection: EntityRelationSelection = {},
): boolean {
    for (const property of schema.getPrimitiveProperties()) {
        const valueA = property.readValue(a);
        const valueB = property.readValue(b);

        if (property.isArray()) {
            if (!isEqual(valueA, valueB)) {
                return false;
            }
        } else if (valueA !== valueB) {
            return false;
        }
    }

    for (const [key, selected] of Object.entries(selection)) {
        const relation = schema.getRelation(key);

        if (relation.isJoined()) {
            continue;
        }

        const valueA = relation.readValue(a);
        const valueB = relation.readValue(b);

        if (valueA == null || valueB == null) {
            if (valueA !== valueB) {
                return false;
            }
        } else if (relation.isArray()) {
            if ((valueA as Entity[]).length !== (valueB as Entity[]).length) {
                return false;
            }

            const relatedSchema = relation.getRelatedSchema();
            const pairs = toEntityPairs(relatedSchema, valueA as Entity[], valueB as Entity[]);

            for (const [relatedA, relatedB] of pairs) {
                if (relatedB === undefined || !isEntityUpdateEqual(relatedSchema, relatedA, relatedB, selected)) {
                    return false;
                }
            }
        }
    }

    return true;
}
