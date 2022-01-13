import { EntitySchema } from "../public";
import { Entity } from "./entity";
import { NormalizedEntities } from "./normalized-entities";

// [todo] not a fan of having the "shouldAddSelf" flag
export function normalizeEntities(
    entitySchema: EntitySchema,
    entities: Entity[],
    shouldAddSelf = true,
    normalized?: NormalizedEntities
): NormalizedEntities {
    normalized = normalized ?? new NormalizedEntities();

    if (shouldAddSelf) {
        normalized.add(entitySchema, entities);
    }

    for (const relation of entitySchema.getRelations()) {
        const navigated: Entity[] = [];

        for (const item of entities) {
            // [todo] support nested path. use EntityReader?
            const value = item[relation.getPath()];
            if (value == null) continue;

            if (Array.isArray(value)) {
                navigated.push(...value);
            } else {
                navigated.push(value);
            }

            delete item[relation.getPath()];
        }

        normalizeEntities(relation.getRelatedSchema(), navigated, true, normalized);
    }

    return normalized;
}
