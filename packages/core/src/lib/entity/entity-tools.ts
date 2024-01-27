import { Class, isPrimitive, isRecord, readPath, toDestructurableInstance, writePath } from "@entity-space/utils";
import { Entity } from "../common/entity.type";
import { getNamedProperties } from "../schema/entity-blueprint";
import { EntityBlueprintInstance } from "../schema/entity-blueprint-instance.type";
import { hasAttribute, hasDtoAttribute } from "../schema/entity-blueprint-property";
import { IEntitySchema, IPropertyValueSchema } from "../schema/schema.interface";
import { ComplexKeyMap } from "./complex-key-map";
import { IEntityTools } from "./entity-tools.interface";

export class EntityTools implements IEntityTools {
    toDestructurable(): IEntityTools {
        return toDestructurableInstance(this);
    }

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
        isArray = false,
        isNullable = false
    ): void {
        if (fromPaths.length === 1) {
            return this.joinEntitiesSinglePath(
                fromEntities,
                toEntities,
                joinedProperty,
                fromPaths[0],
                toPaths[0],
                isArray,
                isNullable
            );
        } else {
            return this.joinEntitiesMultiPath(
                fromEntities,
                toEntities,
                joinedProperty,
                fromPaths,
                toPaths,
                isArray,
                isNullable
            );
        }
    }

    matchesSchema(entity: Entity, schema: IEntitySchema<Entity>): boolean {
        const openRequiredKeys = new Set(
            schema
                .getProperties()
                .filter(property => property.isRequired())
                .map(property => property.getName())
        );
        const properties = new Map(schema.getProperties().map(property => [property.getName(), property]));

        for (const key in entity) {
            const property = properties.get(key);

            if (!property) {
                return false;
            }

            if (!this.matchesValueSchema(entity[key], property.getValueSchema())) {
                return false;
            }

            openRequiredKeys.delete(key);
        }

        return !openRequiredKeys.size;
    }

    dedupeMergeEntities(entities: Entity[], keyPaths: string[]): Entity[] {
        const keyMap = new ComplexKeyMap<Entity, Entity>(keyPaths);

        for (const entity of entities) {
            keyMap.set(entity, entity, (previous, current) => this.mergeEntities(previous, current));
        }

        return keyMap.getAll();
    }

    mergeEntities(...entities: Entity[]): Entity {
        const merged: Entity = {};

        for (const entity of entities) {
            for (const key in entity) {
                const value = entity[key];

                if (value === void 0) {
                    delete merged[key];
                } else if (value !== null && typeof value === "object" && !(value instanceof Date)) {
                    if (typeof merged[key] === "object" && !Array.isArray(value) && !(value instanceof Date)) {
                        merged[key] = this.mergeEntities(merged[key], value);
                    } else {
                        merged[key] = value;
                    }
                } else {
                    merged[key] = value;
                }
            }
        }

        return merged;
    }

    copyEntity(entity: Entity): Entity {
        return this.mergeEntities(entity);
    }

    private joinEntitiesSinglePath(
        fromEntities: Entity[],
        toEntities: Entity[],
        joinedProperty: string,
        fromPath: string,
        toPath: string,
        isArray: boolean,
        isNullable: boolean
    ): void {
        const fromMap = new Map<any, Entity[]>();

        for (const fromEntity of fromEntities) {
            if (isArray) {
                writePath(joinedProperty, fromEntity, []);
            } else if (isNullable) {
                writePath(joinedProperty, fromEntity, null);
            }

            const value = readPath(fromPath, fromEntity);
            const array = fromMap.get(value) ?? fromMap.set(value, []).get(value)!;
            array.push(fromEntity);
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

    private joinEntitiesMultiPath(
        fromEntities: Entity[],
        toEntities: Entity[],
        joinedProperty: string,
        fromPaths: string[],
        toPaths: string[],
        isArray: boolean,
        isNullable: boolean
    ): void {
        const fromMap = new ComplexKeyMap<Entity, Entity[]>(fromPaths);

        for (const fromEntity of fromEntities) {
            if (isArray) {
                writePath(joinedProperty, fromEntity, []);
            } else if (isNullable) {
                writePath(joinedProperty, fromEntity, null);
            }

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

    private matchesValueSchema(value: unknown, schema: IPropertyValueSchema): boolean {
        if (value === null && schema.isNullable()) {
            return true;
        } else if (schema.isArray()) {
            if (!Array.isArray(value)) {
                return false;
            }

            return value.every(value => this.matchesValueSchema(value, schema.getItemSchema()));
        } else if (schema.isPrimitive()) {
            return schema.supportsValue(value);
        } else if (schema.isEntity()) {
            if (!isRecord(value)) {
                return false;
            }

            return this.matchesSchema(value, schema);
        }

        return false;
    }
}
