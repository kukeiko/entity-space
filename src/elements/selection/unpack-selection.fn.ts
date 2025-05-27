import { EntityProperty } from "../entity/entity-property";
import { isEntityRelationProperty } from "../entity/entity-relation-property";
import { EntitySchema } from "../entity/entity-schema";
import { EntitySelection, PackedEntitySelection } from "./entity-selection";
import { getDefaultSelection } from "./get-default-selection.fn";

export function unpackSelection(
    schema: EntitySchema,
    selection: PackedEntitySelection,
    predicate?: (property: EntityProperty) => boolean,
): EntitySelection {
    predicate = predicate ?? (() => true);
    const unpacked = getDefaultSelection(schema, predicate);
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
            if (isEntityRelationProperty(property) && predicate(property)) {
                unpacked[name] = getDefaultSelection(property.getRelatedSchema());
            } else if (predicate(property)) {
                unpacked[name] = true;
            }
        } else if (isEntityRelationProperty(property) && predicate(property)) {
            unpacked[name] = unpackSelection(property.getRelatedSchema(), selectionValue);
        }
    }

    return unpacked;
}
