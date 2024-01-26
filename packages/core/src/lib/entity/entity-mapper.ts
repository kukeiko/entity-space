import { Class, isPrimitive, readPath, writePath } from "@entity-space/utils";
import { Entity } from "../common/entity.type";
import { getNamedProperties } from "../schema/entity-blueprint";
import { EntityBlueprintInstance } from "../schema/entity-blueprint-instance.type";
import { hasAttribute, hasDtoAttribute } from "../schema/entity-blueprint-property";
import { ComplexKeyMap } from "./complex-key-map";

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

    joinEntities(
        fromEntities: Entity[],
        toEntities: Entity[],
        joinedProperty: string,
        fromPaths: string[],
        toPaths: string[],
        isArray: boolean
    ): void {
        if (fromPaths.length === 1) {
            return this.joinEntitiesOnePath(
                fromEntities,
                toEntities,
                joinedProperty,
                fromPaths[0],
                toPaths[0],
                isArray
            );
        } else {
            return this.joinEntitiesManyPaths(fromEntities, toEntities, joinedProperty, fromPaths, toPaths, isArray);
        }
    }

    private joinEntitiesOnePath(
        fromEntities: Entity[],
        toEntities: Entity[],
        joinedProperty: string,
        fromPath: string,
        toPath: string,
        isArray: boolean
    ): void {
        const fromMap = new Map<any, Entity[]>();

        for (const entity of fromEntities) {
            const value = readPath(fromPath, entity);
            const array = fromMap.get(value) ?? fromMap.set(value, []).get(value)!;
            array.push(entity);
        }

        for (const toEntity of toEntities) {
            const value = readPath(toPath, toEntity);
            const fromEntities = fromMap.get(value) ?? [];

            for (const fromEntity of fromEntities) {
                if (isArray) {
                    let array = readPath(joinedProperty, fromEntity) as Entity[] | undefined;

                    if (!array) {
                        writePath(joinedProperty, fromEntity, [toEntity]);
                    } else {
                        array.push(toEntity);
                    }
                } else {
                    writePath(joinedProperty, fromEntity, toEntity);
                }
            }
        }
    }

    private joinEntitiesManyPaths(
        fromEntities: Entity[],
        toEntities: Entity[],
        joinedProperty: string,
        fromPaths: string[],
        toPaths: string[],
        isArray: boolean
    ): void {
        const fromMap = new ComplexKeyMap<Entity, Entity[]>(fromPaths);

        for (const fromEntity of fromEntities) {
            fromMap.set(fromEntity, [fromEntity], (previous, current) => [...previous, ...current]);
        }

        for (const toEntity of toEntities) {
            const fromEntities = fromMap.get(toEntity, toPaths) ?? [];

            for (const fromEntity of fromEntities) {
                if (isArray) {
                    let array = readPath(joinedProperty, fromEntity) as Entity[] | undefined;

                    if (!array) {
                        writePath(joinedProperty, fromEntity, [toEntity]);
                    } else {
                        array.push(toEntity);
                    }
                } else {
                    writePath(joinedProperty, fromEntity, toEntity);
                }
            }
        }
    }
}
