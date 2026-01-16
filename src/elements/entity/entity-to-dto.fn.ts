import { Entity } from "./entity";
import { EntitySchema } from "./entity-schema";

export function entityToDto(schema: EntitySchema, entity: Entity): Entity {
    const properties = schema.getProperties();
    const dto: Entity = {};

    for (const property of properties) {
        if (property.isPrimitive()) {
            property.writeDtoValue(dto, property.readValue(entity));
        }
    }

    return dto;
}
