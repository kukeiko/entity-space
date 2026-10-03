import {
    entitiesToQuery,
    Entity,
    EntityRelationSelection,
    EntitySchema,
    unpackSelection,
} from "@entity-space/elements";
import { EntityServiceContainer } from "../entity-service-container";

export function deleteFromCache(
    services: EntityServiceContainer,
    schema: EntitySchema,
    entities: readonly Entity[],
    selection: EntityRelationSelection,
    cacheKey?: unknown,
): void {
    const cache = services.getOrCreateCache(cacheKey);
    const query = entitiesToQuery(schema, entities, unpackSelection(schema, selection));
    cache.delete(query);
}
