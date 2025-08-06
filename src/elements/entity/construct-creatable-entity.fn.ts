import { PackedEntitySelection } from "../selection/entity-selection";
import { Entity } from "./entity";
import { isEntityPrimitiveProperty } from "./entity-primitive-property";
import { isEntityRelationProperty } from "./entity-relation-property";
import { EntitySchema } from "./entity-schema";
import { isCreatableEntityProperty } from "./is-creatable-entity-property.fn";

export function constructCreatableEntity(schema: EntitySchema, selection: PackedEntitySelection = {}): Entity {
    const entity: Entity = {};

    for (const property of schema.getProperties().filter(isCreatableEntityProperty)) {
        const key = property.getName();

        if (isEntityPrimitiveProperty(property)) {
            entity[key] = property.getDefaultValue();
        } else if (isEntityRelationProperty(property)) {
            if (property.isOptional() && !(key in selection)) {
                continue;
            } else if (property.isArray()) {
                entity[key] = [];
            } else {
                if (selection[key] === "*" || selection[key] === selection) {
                    throw new Error("recursive selection not supported to construct a creatable entity")
                }

                entity[key] = constructCreatableEntity(
                    property.getRelatedSchema(),
                    selection[key] === true ? {} : selection[key],
                );
            }
        }
    }

    return entity;
}
