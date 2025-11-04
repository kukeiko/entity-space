import { EntityProperty } from "../entity/entity-property";
import { isEntityRelationProperty } from "../entity/entity-relation-property";
import { EntitySchema } from "../entity/entity-schema";
import { EntitySelection, PackedEntitySelection } from "./entity-selection";
import { getDefaultSelection } from "./get-default-selection.fn";
import { mergeSelection } from "./merge-selection.fn";
import { toRelationSelection } from "./to-relation-selection.fn";

function unpackSelectionWithoutDefault(
    schema: EntitySchema,
    selection: PackedEntitySelection,
    predicate?: (property: EntityProperty) => boolean,
): EntitySelection {
    predicate = predicate ?? (() => true);
    const unpacked: EntitySelection = {};
    let foundRecursive = false;

    for (const [key, selectionValue] of Object.entries(selection)) {
        if (selectionValue === undefined) {
            continue;
        }

        const property = schema.getProperty(key);

        if (!predicate(property)) {
            continue;
        } else if (isEntityRelationProperty(property)) {
            if (selectionValue === true) {
                unpacked[key] = {};
            } else if (selectionValue === "*" || selectionValue === selection) {
                if (foundRecursive) {
                    throw new Error("a selection with multiple recursive entries on the same level is not supported");
                }

                foundRecursive = true;
                unpacked[key] = unpacked;
            } else {
                unpacked[key] = unpackSelectionWithoutDefault(property.getRelatedSchema(), selectionValue);
            }
        } else {
            unpacked[key] = true;
        }
    }

    return unpacked;
}

export function unpackSelection(
    schema: EntitySchema,
    selection: PackedEntitySelection,
    predicate?: (property: EntityProperty) => boolean,
    skipDefault = false,
): EntitySelection {
    const unpackedWithoutDefaultSelection = unpackSelectionWithoutDefault(schema, selection, predicate);

    if (skipDefault) {
        return unpackedWithoutDefaultSelection;
    }

    const relations = toRelationSelection(schema, unpackedWithoutDefaultSelection);
    const defaultSelection = getDefaultSelection(schema, predicate, relations);

    return mergeSelection(defaultSelection, unpackedWithoutDefaultSelection);
}
