import { IEntitySchema } from "../public";
import { Entity } from "./entity";
import { NormalizedEntities } from "./normalized-entities";

export function normalizeEntities(
    schema: IEntitySchema,
    entities: Entity[],
    normalized?: NormalizedEntities
): NormalizedEntities {
    normalized = normalized ?? new NormalizedEntities();
    normalized.add(schema, entities);

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

        normalizeEntities(relation.getRelatedEntitySchema(), navigated, normalized);
    }

    return normalized;
}
