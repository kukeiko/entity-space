import { EntitySchema, isEntityPrimitiveProperty, isEntityRelationProperty } from "@entity-space/schema";
import { EntitySelection } from "./entity-selection.mjs";

export function getDefaultSelection(schema: EntitySchema): EntitySelection {
    const selection: EntitySelection = {};

    for (const property of schema.getProperties()) {
        if (property.isOptional()) {
            continue;
        }

        if (isEntityPrimitiveProperty(property)) {
            selection[property.getName()] = true;
        } else if (isEntityRelationProperty(property)) {
            selection[property.getName()] = getDefaultSelection(property.getRelatedSchema());
        }
    }

    return selection;
}
