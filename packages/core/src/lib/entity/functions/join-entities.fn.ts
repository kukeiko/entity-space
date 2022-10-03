import { writePath, readPath } from "@entity-space/utils";
import { ComplexKeyMap } from "../data-structures/complex-key-map";
import { Entity } from "../entity";

function joinEntitiesOnePath(
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

function joinEntitiesManyPaths(
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

export function joinEntities(
    fromEntities: Entity[],
    toEntities: Entity[],
    joinedProperty: string,
    fromPaths: string[],
    toPaths: string[],
    isArray: boolean
): void {
    if (fromPaths.length === 1) {
        return joinEntitiesOnePath(fromEntities, toEntities, joinedProperty, fromPaths[0], toPaths[0], isArray);
    } else {
        return joinEntitiesManyPaths(fromEntities, toEntities, joinedProperty, fromPaths, toPaths, isArray);
    }
}
