import { IEntitySchema } from "../../schema";
import { ComplexKeyMap } from "../data-structures";
import { Entity } from "../entity";

function mergeEntitiesInternal(schema: IEntitySchema, ...entities: Entity[]): Entity {
    const merged: Entity = {};

    for (const entity of entities) {
        for (const key in entity) {
            const value = entity[key];

            if (value === void 0) {
                delete merged[key];
            } else if (value !== null && typeof value === "object" && !(value instanceof Date)) {
                const relatedSchema = schema.findRelation(key)?.getRelatedEntitySchema();

                if (!Array.isArray(value) && relatedSchema) {
                    merged[key] = mergeEntitiesInternal(relatedSchema, merged[key] ?? {}, value);
                } else if (Array.isArray(value) && relatedSchema) {
                    merged[key] = mergeEntities(relatedSchema, [...(merged[key] ?? []), ...value]);
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

export function mergeEntities(schema: IEntitySchema, entities: Entity[]): Entity[] {
    const keyMap = new ComplexKeyMap<Entity, Entity>(schema.getKey().getPath());

    for (const entity of entities) {
        keyMap.set(entity, entity, (previous, current) => mergeEntitiesInternal(schema, previous, current));
    }

    return keyMap.getAll();
}
