import { Entity } from "./entity";

export function cloneEntity<T extends Entity>(entity: T): T {
    return structuredClone(entity);
}
