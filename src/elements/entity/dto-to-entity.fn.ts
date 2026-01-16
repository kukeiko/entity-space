import { Entity } from "./entity";
import { EntitySchema } from "./entity-schema";

export function dtoToEntity(schema: EntitySchema, dto: Entity): Entity {
    const properties = schema.getProperties();
    const entity: Entity = {};

    for (const property of properties) {
        const value = property.readDtoValue(dto);

        if (value === undefined) {
            continue;
        } else if (value === null) {
            property.writeValue(entity, value);
        } else if (property.isPrimitive()) {
            property.writeValue(entity, value);
        } else if (property.isRelation()) {
            if (property.isArray()) {
                if (!Array.isArray(value)) {
                    throw new Error(`expected ${property.getDtoNameWithSchema()} to be an array`);
                }

                property.writeValue(
                    entity,
                    value.map(relatedDto => dtoToEntity(property.getRelatedSchema(), relatedDto)),
                );
            } else {
                property.writeValue(entity, dtoToEntity(property.getRelatedSchema(), value));
            }
        }
    }

    return entity;
}
