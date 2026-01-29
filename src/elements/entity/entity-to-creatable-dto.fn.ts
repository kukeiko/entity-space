import { EntityRelationSelection } from "../selection/entity-selection";
import { Entity } from "./entity";
import { EntitySchema } from "./entity-schema";

export function entityToCreatableDto(
    schema: EntitySchema,
    entity: Entity,
    selection?: EntityRelationSelection,
): Entity {
    const dto: Entity = {};
    const properties = schema.getProperties();
    selection = selection ?? {};

    for (const property of properties) {
        const value = property.readValue(entity);

        if (value === undefined || !property.isCreatable()) {
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
                        entityToCreatableDto(property.getRelatedSchema(), entity, selection[property.getName()]),
                    );

                property.writeDtoValue(dto, relatedDtos);
            } else {
                const relatedDto = entityToCreatableDto(
                    property.getRelatedSchema(),
                    property.readValue(entity) as Entity,
                    selection[property.getName()],
                );

                property.writeDtoValue(dto, relatedDto);
            }
        }
    }

    return dto;
}
