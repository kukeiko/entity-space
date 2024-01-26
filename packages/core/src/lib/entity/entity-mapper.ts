import { Class, isPrimitive } from "@entity-space/utils";
import { Entity } from "../common/entity.type";
import { getNamedProperties } from "../schema/entity-blueprint";
import { EntityBlueprintInstance } from "../schema/entity-blueprint-instance.type";
import { hasAttribute, hasDtoAttribute } from "../schema/entity-blueprint-property";

export class EntityMapper {
    toEntityFromDto<T>(blueprint: Class<T>, dto: Record<string, unknown>): EntityBlueprintInstance<T> {
        const properties = getNamedProperties(blueprint);
        const entity: Record<string, unknown> = {};

        properties.forEach(property => {
            if (hasDtoAttribute(property) && dto[property.dto] == null) {
                return;
            } else if (!hasDtoAttribute(property) && dto[property.name] == null) {
                return;
            }

            if (isPrimitive(property.valueType)) {
                if (hasDtoAttribute(property)) {
                    entity[property.name] = dto[property.dto];
                } else {
                    entity[property.name] = dto[property.name];
                }
            } else if (hasAttribute("array", property) && hasAttribute("relation", property)) {
                if (hasDtoAttribute(property)) {
                    entity[property.name] = (dto[property.dto] as any[]).map(dto =>
                        this.toEntityFromDto(property.valueType as Class, dto)
                    );
                } else {
                    entity[property.name] = (dto[property.name] as any[]).map(dto =>
                        this.toEntityFromDto(property.valueType as Class, dto)
                    );
                }
            } else if (hasAttribute("relation", property)) {
                if (hasDtoAttribute(property)) {
                    entity[property.name] = this.toEntityFromDto(property.valueType as Class, dto[property.dto] as any);
                } else {
                    entity[property.name] = this.toEntityFromDto(
                        property.valueType as Class,
                        dto[property.name] as any
                    );
                }
            }
        });

        return entity as EntityBlueprintInstance<T>;
    }

    toDtoFromEntity<T>(
        blueprint: Class<T>,
        entity: EntityBlueprintInstance<T>,
        options: { writableOnly?: boolean }
    ): Entity {
        const properties = getNamedProperties(blueprint);
        const dto: Entity = {};

        properties.forEach(property => {
            if (isPrimitive(property.valueType)) {
                if (options.writableOnly && !hasAttribute("writable", property)) {
                    return;
                }

                if (hasDtoAttribute(property)) {
                    dto[property.dto] = (entity as any)[property.name];
                } else {
                    dto[property.name] = (entity as any)[property.name];
                }
            }
        });

        return dto;
    }
}
