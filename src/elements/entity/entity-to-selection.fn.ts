import { EntitySelection } from "../selection/entity-selection";
import { mergeSelections } from "../selection/merge-selections.fn";
import { Entity } from "./entity";
import { isEntityPrimitiveProperty } from "./entity-primitive-property";
import { isEntityRelationProperty } from "./entity-relation-property";
import { EntitySchema } from "./entity-schema";

export function entityToSelection(schema: EntitySchema, entity: Entity): EntitySelection {
    const selection: EntitySelection = {};

    for (const property of schema.getProperties()) {
        const key = property.getName();

        if (entity[key] === undefined) {
            continue;
        }

        if (isEntityPrimitiveProperty(property)) {
            selection[key] = true;
        } else if (isEntityRelationProperty(property)) {
            if (property.isArray()) {
                selection[key] = mergeSelections(
                    (entity[key] as Entity[]).map(entity => entityToSelection(property.getRelatedSchema(), entity)),
                );
            } else {
                selection[key] = entityToSelection(property.getRelatedSchema(), entity[key]);
            }
        }
    }

    return selection;
}
