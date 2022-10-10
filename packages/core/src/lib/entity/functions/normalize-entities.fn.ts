import { IEntitySchema } from "@entity-space/common";
import { NormalizedEntities } from "../data-structures/normalized-entities";
import { Entity } from "../entity";

// [todo] protect against recursion. data read from entity-space is not cyclical, but user-provided entities might be.
export function normalizeEntities(
    schema: IEntitySchema,
    entities: Entity[],
    normalized?: NormalizedEntities
): NormalizedEntities {
    normalized = normalized ?? new NormalizedEntities();
    normalized.add(schema, entities);

    // [todo] not dealing with relations on non-related entities yet - i.e. entities that themselves
    // are not to be normalized, but have references to entities that do need to be normalized
    for (const relation of schema.getRelations()) {
        const navigated: Entity[] = [];

        for (const entity of entities) {
            // [todo] support nested path. use EntityReader?
            const value = entity[relation.getPropertyName()];

            if (value == null) continue;

            if (Array.isArray(value)) {
                navigated.push(...value);
            } else {
                navigated.push(value);
            }

            delete entity[relation.getPropertyName()];
        }

        if (navigated.length > 0) {
            normalizeEntities(relation.getRelatedEntitySchema(), navigated, normalized);
        }
    }

    return normalized;
}
