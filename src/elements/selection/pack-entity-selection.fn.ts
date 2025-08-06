import { isEntityRelationProperty } from "../entity/entity-relation-property";
import { EntitySchema } from "../entity/entity-schema";
import { EntitySelection, PackedEntitySelection } from "./entity-selection";

function packEntitySelectionCore(
    schema: EntitySchema,
    selection: EntitySelection,
    visited: Map<EntitySelection, PackedEntitySelection>,
): PackedEntitySelection {
    const packed: PackedEntitySelection = {};
    visited.set(selection, packed);

    for (const [name, selectionValue] of Object.entries(selection)) {
        const property = schema.getProperty(name);

        if (selectionValue === true) {
            if (property.isOptional()) {
                packed[name] = true;
            }
        } else if (visited.has(selectionValue)) {
            packed[name] = visited.get(selectionValue)!;
        } else if (isEntityRelationProperty(property)) {
            const nestedPacked = packEntitySelectionCore(property.getRelatedSchema(), selectionValue, visited);

            if (Object.keys(nestedPacked).length) {
                packed[name] = nestedPacked;
            } else if (property.isOptional()) {
                packed[name] = true;
            }
        }
    }

    if (Object.entries(packed).every(([key, value]) => !schema.getProperty(key).isOptional() && value === packed)) {
        // return empty if every entry is recursive and every selection is optional
        return {};
    }

    return packed;
}

export function packEntitySelection(schema: EntitySchema, selection: EntitySelection): PackedEntitySelection {
    return packEntitySelectionCore(schema, selection, new Map());
}
