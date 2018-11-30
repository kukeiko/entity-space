import { TypeOf } from "../util";
import { EntityType, IEntity } from "../metadata";

export interface Builder {
    build(entities: IEntity[]): void;
}

let byEntityTypeMap = new Map<EntityType<any>, TypeOf<Builder>>();

/**
 * A service implements a connection to an api for loading, saving and deleting entities.
 * They must always return entities in their dto format (if they have one).
 */
export function BuilderFor(entityTypes?: EntityType<any>[]) {
    return (type: TypeOf<Builder>) => {
        entityTypes.forEach(entityType => byEntityTypeMap.set(entityType, type));
    };
}

export function hasBuilderFor(entityClass: EntityType<any>): boolean {
    return byEntityTypeMap.has(entityClass);
}

export function getBuilderClass(entityType: EntityType<any>): TypeOf<Builder> {
    let type = byEntityTypeMap.get(entityType);
    if (!type) return null;

    return type || null;
}

export function getAllBuilderClasses(): Map<EntityType<any>, TypeOf<Builder>> {
    return byEntityTypeMap;
}
