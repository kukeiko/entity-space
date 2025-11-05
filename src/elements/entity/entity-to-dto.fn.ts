import { Class, isPrimitiveType } from "@entity-space/utils";
import { Entity } from "./entity";
import { getNamedProperties } from "./entity-blueprint";
import { hasAttribute } from "./entity-blueprint-property";

export function entityToDto(blueprint: Class, entity: Entity, options?: { writableOnly?: boolean }): Entity {
    const properties = getNamedProperties(blueprint);
    const dto: Entity = {};

    properties.forEach(property => {
        if (isPrimitiveType(property.valueType)) {
            if (options?.writableOnly && hasAttribute("readonly", property)) {
                return;
            }

            if (hasAttribute("dto", property)) {
                dto[property.dto] = (entity as any)[property.name];
            } else {
                dto[property.name] = (entity as any)[property.name];
            }
        }
    });

    return dto;
}
