import { Entity } from "./entity";

export function mergeEntities(entities: Entity[]): Entity {
    const merged: Entity = {};

    for (const entity of entities) {
        for (const key in entity) {
            const value = entity[key];

            if (value === undefined) {
                delete merged[key];
            } else if (value !== null && typeof value === "object" && !(value instanceof Date)) {
                if (typeof merged[key] === "object" && !Array.isArray(value)) {
                    merged[key] = mergeEntities([merged[key], value]);
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
