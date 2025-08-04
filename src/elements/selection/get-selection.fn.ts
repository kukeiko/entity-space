import { isEntityPrimitiveProperty } from "../entity/entity-primitive-property";
import { EntityProperty } from "../entity/entity-property";
import { isEntityRelationProperty } from "../entity/entity-relation-property";
import { EntitySchema } from "../entity/entity-schema";
import { EntityRelationSelection, EntitySelection } from "./entity-selection";

export function getSelection(
    schema: EntitySchema,
    relations?: EntityRelationSelection,
    predicate?: (property: EntityProperty) => boolean,
): EntitySelection {
    predicate = predicate ?? (() => true);
    const selection: EntitySelection = {};

    for (const property of schema.getProperties()) {
        if (isEntityPrimitiveProperty(property) && predicate(property)) {
            selection[property.getName()] = true;
        } else if (
            isEntityRelationProperty(property) &&
            predicate(property) &&
            (relations === undefined || relations[property.getName()])
        ) {
            selection[property.getName()] = getSelection(
                property.getRelatedSchema(),
                relations === undefined ? undefined : (relations?.[property.getName()] ?? {}),
                candidate => candidate !== property && predicate(candidate),
            );
        }
    }

    return selection;
}
