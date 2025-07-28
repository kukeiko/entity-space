import { isEntityPrimitiveProperty } from "../entity/entity-primitive-property";
import { EntityProperty } from "../entity/entity-property";
import { isEntityRelationProperty } from "../entity/entity-relation-property";
import { EntitySchema } from "../entity/entity-schema";
import { EntityRelationSelection, EntitySelection } from "./entity-selection";

// [todo] ❌ almost a carbon copy of "getDefaultSelection()"
export function getSelection(
    schema: EntitySchema,
    predicate?: (property: EntityProperty) => boolean,
    relationSelection?: EntityRelationSelection,
): EntitySelection {
    predicate = predicate ?? (() => true);
    const selection: EntitySelection = {};

    for (const property of schema.getProperties()) {
        if (isEntityPrimitiveProperty(property) && predicate(property)) {
            selection[property.getName()] = true;
        } else if (
            isEntityRelationProperty(property) &&
            predicate(property) &&
            (relationSelection === undefined || relationSelection[property.getName()])
        ) {
            selection[property.getName()] = getSelection(
                property.getRelatedSchema(),
                candidate => candidate !== property && predicate(candidate), // [todo] really wonky way of preventing endless loops
                relationSelection === undefined ? undefined : relationSelection?.[property.getName()] ?? {},
            );
        }
    }

    return selection;
}
