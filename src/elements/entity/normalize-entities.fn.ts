import { Entity } from "./entity";
import { EntitySchema } from "./entity-schema";

function normalizeEntitiesCore(
    schema: EntitySchema,
    entities: readonly Entity[],
    normalized: Map<EntitySchema, Entity[]>,
): void {
    for (const relation of schema.getRelations()) {
        const name = relation.getName();
        const relatedEntities = relation.readValuesFlat(entities);

        if (!relatedEntities.length) {
            continue;
        }

        const relatedSchema = relation.getRelatedSchema();

        if (relation.isJoined()) {
            for (const entity of entities) {
                delete entity[name];
            }

            if (!normalized.has(relatedSchema)) {
                normalized.set(relatedSchema, []);
            }

            normalized.get(relatedSchema)!.push(...relatedEntities);
        }

        normalizeEntitiesCore(relatedSchema, relatedEntities, normalized);
    }
}

export function normalizeEntities(schema: EntitySchema, entities: readonly Entity[]): Map<EntitySchema, Entity[]> {
    const normalized = new Map<EntitySchema, Entity[]>();
    normalized.set(schema, entities.slice());
    normalizeEntitiesCore(schema, entities, normalized);

    return normalized;
}
