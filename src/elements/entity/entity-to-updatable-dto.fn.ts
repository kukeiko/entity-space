import { EntityRelationSelection } from "../selection/entity-selection";
import { Entity } from "./entity";
import { EntitySchema } from "./entity-schema";

export function entityToUpdatableDto(
    schema: EntitySchema,
    entity: Entity,
    selection?: EntityRelationSelection,
    includeId = false,
): Entity {
    const dto: Entity = {};
    const properties = schema.getProperties();
    selection = selection ?? {};

    for (const property of properties) {
        const value = property.readValue(entity);

        if (value === undefined || (property.isReadonly() && !(includeId && schema.isIdProperty(property.getName())))) {
            continue;
        } else if (property.isPrimitive()) {
            property.writeDtoValue(dto, value);
        } else if (property.isRelation() && selection[property.getName()]) {
            if (value === null) {
                property.writeDtoValue(dto, value);
            } else if (property.isArray()) {
                const relatedDtos = property
                    .readValue<Entity[]>(entity)
                    .map(entity =>
                        entityToUpdatableDto(
                            property.getRelatedSchema(),
                            entity,
                            selection[property.getName()],
                            includeId,
                        ),
                    );

                property.writeDtoValue(dto, relatedDtos);
            } else {
                const relatedDto = entityToUpdatableDto(
                    property.getRelatedSchema(),
                    property.readValue<Entity>(entity),
                    selection[property.getName()],
                    includeId,
                );

                property.writeDtoValue(dto, relatedDto);
            }
        }
    }

    return dto;
}
