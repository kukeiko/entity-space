import { isEntityPrimitiveProperty } from "../entity/entity-primitive-property";
import { EntityProperty } from "../entity/entity-property";
import { EntityRelationProperty, isEntityRelationProperty } from "../entity/entity-relation-property";
import { EntitySchema } from "../entity/entity-schema";
import { EntitySelection } from "./entity-selection";

function getDefaultSelectionCore(
    schema: EntitySchema,
    selection: EntitySelection,
    predicate: (property: EntityProperty) => boolean,
    visited = new Map<EntityRelationProperty, EntitySelection>(),
): void {
    for (const property of schema.getProperties()) {
        if (property.isOptional()) {
            continue;
        }

        if (isEntityPrimitiveProperty(property) && predicate(property)) {
            selection[property.getName()] = true;
        } else if (isEntityRelationProperty(property) && predicate(property)) {
            if (!visited.has(property)) {
                visited.set(property, {});
                getDefaultSelectionCore(property.getRelatedSchema(), visited.get(property)!, predicate, visited);
            }

            selection[property.getName()] = visited.get(property)!;
        }
    }
}

export function getDefaultSelection(
    schema: EntitySchema,
    predicate?: (property: EntityProperty) => boolean,
): EntitySelection {
    const selection: EntitySelection = {};
    predicate = predicate ?? (() => true);
    getDefaultSelectionCore(schema, selection, predicate);

    return selection;
}
