import { readPath, writePath } from "@entity-space/utils";
import { Entity } from "./entity";
import { EntitySchema } from "./entity-schema";

export function getEntityId(schema: EntitySchema, entity: Entity): Entity {
    if (!schema.hasId()) {
        throw new Error(`schema ${schema.getName()} has no id defined`)
    }

    const id: Entity = {};

    for (const idPath of schema.getIdPaths()) {
        const value = readPath(idPath, entity);

        if (value == null) {
            throw new Error(`value on property ${idPath.toString()} was nullsy`)
        }

        writePath(idPath, id, value);
    }

    return id;
}
