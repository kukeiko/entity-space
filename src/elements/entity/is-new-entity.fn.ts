import { Entity } from "./entity";
import { entityHasId } from "./entity-has-id.fn";
import { EntitySchema } from "./entity-schema";

export function isNewEntity(schema: EntitySchema, entity: Entity): boolean {
    if (!schema.hasId()) {
        // [todo] should throw an error if it doesn't have an id, and current usage could be changed to new fn "isEmbeddedOrNewEntity()"
        return true;
    }

    return !entityHasId(schema, entity);
}
