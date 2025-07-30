import { Class, isPrimitiveType } from "@entity-space/utils";
import { EntityBlueprint, getNamedProperties } from "./entity-blueprint";
import { hasAttribute } from "./entity-blueprint-property";

// [todo] ❓ should accept EntitySchema instead of Blueprint?
export function dtoToEntity<T>(blueprint: Class<T>, dto: Record<string, unknown>): EntityBlueprint.Instance<T> {
    const properties = getNamedProperties(blueprint);
    const entity: Record<string, unknown> = {};

    properties.forEach(property => {
        if (hasAttribute("dto", property) && dto[property.dto] === undefined) {
            return;
        } else if (!hasAttribute("dto", property) && dto[property.name] === undefined) {
            return;
        }

        if (hasAttribute("dto", property) && dto[property.dto] === null) {
            entity[property.name] = dto[property.dto];
        } else if (!hasAttribute("dto", property) && dto[property.name] === null) {
            entity[property.name] = dto[property.name];
        } else if (isPrimitiveType(property.valueType)) {
            if (hasAttribute("dto", property)) {
                entity[property.name] = dto[property.dto];
            } else {
                entity[property.name] = dto[property.name];
            }
        } else if (hasAttribute("array", property) && hasAttribute("entity", property)) {
            if (hasAttribute("dto", property)) {
                entity[property.name] = (dto[property.dto] as any[]).map(dto =>
                    dtoToEntity(property.valueType as Class, dto),
                );
            } else {
                entity[property.name] = (dto[property.name] as any[]).map(dto =>
                    dtoToEntity(property.valueType as Class, dto),
                );
            }
        } else if (hasAttribute("entity", property)) {
            if (hasAttribute("dto", property)) {
                entity[property.name] = dtoToEntity(property.valueType as Class, dto[property.dto] as any);
            } else {
                entity[property.name] = dtoToEntity(property.valueType as Class, dto[property.name] as any);
            }
        }
    });

    return entity as EntityBlueprint.Instance<T>;
}
