import { isEntityPrimitiveProperty } from "../entity/entity-primitive-property";
import { isEntityRelationProperty } from "../entity/entity-relation-property";
import { EntitySchema } from "../entity/entity-schema";
import { EntityRelationSelection, EntitySelection } from "./entity-selection";

export function getSelection(schema: EntitySchema, relations: EntityRelationSelection = {}): EntitySelection {
    const selection: EntitySelection = {};

    for (const property of schema.getProperties()) {
        if (isEntityPrimitiveProperty(property)) {
            selection[property.getName()] = true;
        } else if (isEntityRelationProperty(property) && relations[property.getName()]) {
            if (relations && relations[property.getName()] === relations) {
                selection[property.getName()] = selection;
            } else {
                selection[property.getName()] = getSelection(
                    property.getRelatedSchema(),
                    relations[property.getName()],
                );
            }
        }
    }

    return selection;
}
