import { readPath, writePath } from "@entity-space/utils";
import { Entity } from "./entity";
import { EntitySchema } from "./entity-schema";

export function entityToId(schema: EntitySchema, entity: Entity): Entity {
    const id: Entity = {};

    for (const idPath of schema.getIdPaths()) {
        writePath(idPath, id, readPath(idPath, entity));
    }

    return id;
}
