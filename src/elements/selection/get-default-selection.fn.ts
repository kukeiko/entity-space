import { isEntityPrimitiveProperty } from "../entity/entity-primitive-property";
import { EntityProperty } from "../entity/entity-property";
import { isEntityRelationProperty } from "../entity/entity-relation-property";
import { EntitySchema } from "../entity/entity-schema";
import { EntitySelection } from "./entity-selection";

export function getDefaultSelection(
    schema: EntitySchema,
    predicate?: (property: EntityProperty) => boolean,
): EntitySelection {
    predicate = predicate ?? (() => true);
    const selection: EntitySelection = {};

    for (const property of schema.getProperties()) {
        if (property.isOptional()) {
            continue;
        }

        if (isEntityPrimitiveProperty(property) && predicate(property)) {
            selection[property.getName()] = true;
        } else if (isEntityRelationProperty(property) && predicate(property)) {
            selection[property.getName()] = getDefaultSelection(property.getRelatedSchema(), predicate);
        }
    }

    return selection;
}
