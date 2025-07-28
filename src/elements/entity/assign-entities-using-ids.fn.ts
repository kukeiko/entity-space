import { ComplexKeyMap } from "@entity-space/utils";
import { EntitySelection } from "../selection/entity-selection";
import { Entity } from "./entity";
import { EntitySchema } from "./entity-schema";

export function assignEntitiesUsingIds(
    schema: EntitySchema,
    selection: EntitySelection,
    targets: readonly Entity[],
    sources: readonly Entity[],
): void {
    let sourcesMap: Map<Entity, Entity>;

    if (schema.hasId()) {
        // [todo] ❌ hack
        sourcesMap = new ComplexKeyMap(schema.getIdPaths()) as any as Map<Entity, Entity>;

        for (const source of sources) {
            sourcesMap.set(source, source);
        }
    } else {
        // [todo] ❌ can we use "toEntityPairs()" here instead?
        sourcesMap = new Map();

        if (targets.length !== sources.length) {
            throw new Error("expected array of non-id entities to be of same length");
        }

        targets.forEach((target, index) => sourcesMap.set(target, sources[index]));
    }

    for (const target of targets) {
        const source = sourcesMap.get(target);

        if (source === undefined) {
            continue;
        }

        for (const [key, selectionValue] of Object.entries(selection)) {
            if (schema.isPrimitive(key)) {
                if (schema.getPrimitive(key).isArray() && Array.isArray(source[key])) {
                    target[key] = source[key].slice();
                } else if (source[key] !== undefined) {
                    target[key] = source[key];
                }
            } else if (selectionValue === true) {
                throw new Error(`invalid selection, expected ${schema.getName()}.${key} not to be true`);
            } else {
                const relation = schema.getRelation(key);
                const relatedSchema = relation.getRelatedSchema();

                if (relation.isArray()) {
                    if (Array.isArray(target[key]) && Array.isArray(source[key])) {
                        assignEntitiesUsingIds(relatedSchema, selectionValue, target[key], source[key]);
                    }
                } else {
                    if (target[key] != null && source[key] != null) {
                        assignEntitiesUsingIds(relatedSchema, selectionValue, [target[key]], [source[key]]);
                    }
                }
            }
        }
    }
}
