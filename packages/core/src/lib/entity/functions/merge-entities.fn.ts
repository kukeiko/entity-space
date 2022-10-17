import { IEntitySchema } from "@entity-space/common";
import { uniq } from "lodash";
import { ComplexKeyMap } from "../data-structures/complex-key-map";
import { Entity } from "../entity";

function mergeEntitiesInternal(schema: IEntitySchema, ...entities: Entity[]): Entity {
    // [todo] why did i do uniq()? if i find out, i should document it
    const [merged, ...others] = uniq(entities);

    for (const entity of others) {
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

export function mergeEntities<T extends Entity = Entity>(schema: IEntitySchema, entities: T[]): T[] {
    const keyMap = new ComplexKeyMap<T, T>(schema.getKey().getPath());

    for (const entity of entities) {
        keyMap.set(entity, entity, (previous, current) => mergeEntitiesInternal(schema, previous, current) as T);
    }

    return keyMap.getAll();
}
