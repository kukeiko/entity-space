import { ComplexKeyMap } from "@entity-space/utils";
import { Entity } from "./entity";
import { EntitySchema } from "./entity-schema";

export function deduplicateEntities(schema: EntitySchema, entities: readonly Entity[]): Entity[] {
    const map = new ComplexKeyMap(schema.getIdPaths());

    for (const entity of entities) {
        map.set(entity, entity);
    }

    return map.getAll();
}
