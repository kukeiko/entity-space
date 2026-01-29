import { EntityRelationSelection } from "../selection/entity-selection";
import { Entity } from "./entity";
import { entityHasId } from "./entity-has-id.fn";
import { EntitySchema } from "./entity-schema";

export function entityToSavableDto(
    schema: EntitySchema,
    entity: Entity,
    selection?: EntityRelationSelection,
    includeId = false,
): Entity {
    const dto: Entity = {};
    const properties = schema.getProperties();
    selection = selection ?? {};
    const hasId = entityHasId(schema, entity);

    for (const property of properties) {
        const value = property.readValue(entity);

        const skip = hasId
            ? value === undefined || (property.isReadonly() && !(includeId && schema.isIdProperty(property.getName())))
            : value === undefined || !property.isCreatable();

        if (skip) {
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
                        entityToSavableDto(
                            property.getRelatedSchema(),
                            entity,
                            selection[property.getName()],
                            includeId,
                        ),
                    );

                property.writeDtoValue(dto, relatedDtos);
            } else {
                const relatedDto = entityToSavableDto(
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
