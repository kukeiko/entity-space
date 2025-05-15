import { EntitySchema, isEntityRelationProperty } from "@entity-space/schema";
import { EntitySelection, TypedEntitySelection } from "./entity-selection.mjs";
import { getDefaultSelection } from "./get-default-selection.fn.mjs";

export function unpackSelection(schema: EntitySchema, selection: TypedEntitySelection): EntitySelection {
    const unpacked = getDefaultSelection(schema);
    const propertyMap = new Map(schema.getProperties().map(property => [property.getName(), property]));

    for (const [name, selectionValue] of Object.entries(selection)) {
        if (selectionValue === undefined) {
            continue;
        }

        const property = propertyMap.get(name);

        if (property === undefined) {
            throw new Error(`property ${schema.getName()}.${name} does not exist`);
        }

        if (selectionValue === true) {
            if (isEntityRelationProperty(property)) {
                unpacked[name] = getDefaultSelection(property.getRelatedSchema());
            } else {
                unpacked[name] = true;
            }
        } else if (isEntityRelationProperty(property)) {
            unpacked[name] = unpackSelection(property.getRelatedSchema(), selectionValue);
        }
    }

    return unpacked;
}
