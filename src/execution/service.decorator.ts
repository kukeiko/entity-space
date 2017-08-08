import { TypeOf } from "../util";
import { EntityType } from "../metadata";
import { IService } from "./service.type";

let byEntityTypeMap = new Map<EntityType<any>, TypeOf<IService>>();

/**
 * A service implements a connection to an api for loading, saving and deleting entities.
 * They must always return entities in their dto format (if they have one).
 */
export function Service(entityTypes?: EntityType<any>[]) {
    return (type: TypeOf<IService>) => {
        entityTypes.forEach(entityType => byEntityTypeMap.set(entityType, type));
    };
}

export function getServiceType(entityType: EntityType<any>): TypeOf<IService> {
    let type = byEntityTypeMap.get(entityType);
    if (!type) return null;

    return type || null;
}

export function getAllServiceTypes(): Map<EntityType<any>, TypeOf<IService>> {
    return byEntityTypeMap;
}
