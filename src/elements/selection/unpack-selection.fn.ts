import { EntityProperty } from "../entity/entity-property";
import { EntitySchema } from "../entity/entity-schema";
import { EntitySelection, PackedEntitySelection } from "./entity-selection";
import { getDefaultSelection } from "./get-default-selection.fn";
import { mergeSelection } from "./merge-selection.fn";
import { toRelationSelection } from "./to-relation-selection.fn";
import { unpackSelectionWithoutDefault } from "./unpack-selection-without-default.fn";

export function unpackSelection(
    schema: EntitySchema,
    selection: PackedEntitySelection,
    predicate?: (property: EntityProperty) => boolean,
): EntitySelection {
    const unpackedWithoutDefaultSelection = unpackSelectionWithoutDefault(schema, selection, predicate);
    const relations = toRelationSelection(schema, unpackedWithoutDefaultSelection);
    const defaultSelection = getDefaultSelection(schema, predicate, relations);

    return mergeSelection(defaultSelection, unpackedWithoutDefaultSelection);
}
