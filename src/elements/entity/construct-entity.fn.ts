import { EntitySelection } from "../selection/entity-selection";
import { Entity } from "./entity";
import { isEntityPrimitiveProperty } from "./entity-primitive-property";
import { isEntityRelationProperty } from "./entity-relation-property";
import { EntitySchema } from "./entity-schema";

export function constructEntity(schema: EntitySchema, selection: EntitySelection = {}): Entity {
    const entity: Entity = {};

    for (const [key, selectedValue] of Object.entries(selection)) {
        const property = schema.getProperty(key);

        if (property.isNullable()) {
            entity[key] = null;
        } else if (isEntityPrimitiveProperty(property)) {
            entity[key] = property.getDefaultValue();
        } else if (isEntityRelationProperty(property)) {
            if (selectedValue === true) {
                throw new Error(`invalid selection, expected ${schema.getName()}.${key} not to be true`);
            } else if (selectedValue === selection) {
                throw new Error("recursive selection not supported to construct a default entity");
            } else if (property.isArray()) {
                entity[key] = [];
            } else {
                entity[key] = constructEntity(property.getRelatedSchema(), selectedValue);
            }
        }
    }

    return entity;
}
