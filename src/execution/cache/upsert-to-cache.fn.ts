import { Entity, EntityRelationSelection, EntitySchema, entityToQuery, unpackSelection } from "@entity-space/elements";
import { EntityServiceContainer } from "../entity-service-container";

export function upsertToCache(
    services: EntityServiceContainer,
    schema: EntitySchema,
    entity: Entity,
    selection?: EntityRelationSelection,
    cacheKey?: unknown,
): void {
    const cache = services.getOrCreateCache(cacheKey);
    const query = entityToQuery(schema, entity, selection ? unpackSelection(schema, selection) : undefined);
    cache.upsertQuery(query, [entity]);
}
