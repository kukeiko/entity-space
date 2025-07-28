import { EntityProperty } from "../entity/entity-property";
import { EntitySchema } from "../entity/entity-schema";
import { EntitySelection } from "./entity-selection";
import { getDefaultSelection } from "./get-default-selection.fn";
import { mergeSelection } from "./merge-selection.fn";

export function addDefaultSelection(schema: EntitySchema, selection: EntitySelection): EntitySelection {
    const isPrimitiveOrNotInSelection = (property: EntityProperty) =>
        schema.isPrimitive(property.getName()) || !(property.getName() in selection);

    const defaultSelection = getDefaultSelection(schema, isPrimitiveOrNotInSelection);
    const mergedWithDefault = mergeSelection(defaultSelection, selection);

    for (const [key, selected] of Object.entries(selection)) {
        if (selected === true) {
            continue;
        }

        const relation = schema.getRelation(key);
        mergedWithDefault[key] = addDefaultSelection(relation.getRelatedSchema(), selected);
    }

    return mergedWithDefault;
}
