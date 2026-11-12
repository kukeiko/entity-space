import {
    entitiesToQuery,
    Entity,
    EntityRelationSelection,
    EntitySchema,
    unpackSelection,
} from "@entity-space/elements";
import { EntityCache } from "./entity-cache";

export function deleteFromCache(
    cache: EntityCache,
    schema: EntitySchema,
    entities: readonly Entity[],
    selection: EntityRelationSelection,
): void {
    const query = entitiesToQuery(schema, entities, unpackSelection(schema, selection));
    cache.deleteQuery(query);
}
