import { Entity } from "./entity";
import { EntitySchema } from "./entity-schema";
import { isNewEntity } from "./is-new-entity.fn";

export function isPersistedEntity(schema: EntitySchema, entity: Entity): boolean {
    if (!schema.hasId()) {
        // [todo] should throw an error if it doesn't have an id, and current usage could be changed to new fn "isEmbeddedOrPersistedEntity()"
        return true;
    }

    return !isNewEntity(schema, entity);
}
