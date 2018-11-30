import { TypeOf, StringIndexable } from "../util";
import { EntityType, IEntity, AnyEntityType } from "../metadata";
import { Saveables, Query } from "../elements";

export interface Service {
    load: (q: Query<any>) => Promise<StringIndexable[]>;
    save?: (saveables: Saveables) => Promise<Map<AnyEntityType, StringIndexable[]>>;
    delete?: (entities: IEntity[]) => Promise<void>;
}

let byEntityTypeMap = new Map<EntityType<any>, TypeOf<Service>>();

/**
 * A service implements a connection to an api for loading, saving and deleting entities.
 * They must always return entities in their dto format (if they have one).
 */
export function ServiceFor(entityTypes?: EntityType<any>[]) {
    return (type: TypeOf<Service>) => {
        entityTypes.forEach(entityType => byEntityTypeMap.set(entityType, type));
    };
}

export function getServiceType(entityType: EntityType<any>): TypeOf<Service> {
    let type = byEntityTypeMap.get(entityType);
    if (!type) return null;

    return type || null;
}

export function getAllServiceTypes(): Map<EntityType<any>, TypeOf<Service>> {
    return byEntityTypeMap;
}
