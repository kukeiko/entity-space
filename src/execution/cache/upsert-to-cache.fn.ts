import { Entity, EntityRelationSelection, EntitySchema, entityToQuery, unpackSelection } from "@entity-space/elements";
import { EntityCache } from "./entity-cache";

export function upsertToCache(
    cache: EntityCache,
    schema: EntitySchema,
    entity: Entity,
    selection?: EntityRelationSelection,
): void {
    const query = entityToQuery(schema, entity, selection ? unpackSelection(schema, selection) : undefined);
    cache.upsertQuery(query, [entity]);
}
