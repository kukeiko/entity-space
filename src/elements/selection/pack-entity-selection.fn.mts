import { EntitySchema, isEntityRelationProperty } from "@entity-space/schema";
import { EntitySelection } from "./entity-selection.mjs";

export function packEntitySelection(schema: EntitySchema, selection: EntitySelection): EntitySelection {
    const packed: EntitySelection = {};
    const propertyMap = new Map(schema.getProperties().map(property => [property.getName(), property]));

    for (const [name, selectionValue] of Object.entries(selection)) {
        const property = propertyMap.get(name);

        if (property === undefined) {
            throw new Error(`property ${schema.getName()}.${name} does not exist`);
        }

        if (selectionValue === true) {
            if (property.isOptional()) {
                packed[name] = true;
            }
        } else if (isEntityRelationProperty(property)) {
            const nestedPacked = packEntitySelection(property.getRelatedSchema(), selectionValue);

            if (Object.keys(nestedPacked).length) {
                packed[name] = nestedPacked;
            } else if (property.isOptional()) {
                packed[name] = true;
            }
        }
    }

    return packed;
}
