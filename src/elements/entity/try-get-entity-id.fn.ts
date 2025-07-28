import { readPath, writePath } from "@entity-space/utils";
import { Entity } from "./entity";
import { EntitySchema } from "./entity-schema";

export function tryGetEntityId(schema: EntitySchema, entity: Entity): Entity | undefined {
    if (!schema.hasId()) {
        return undefined;
    }

    const id: Entity = {};

    for (const idPath of schema.getIdPaths()) {
        const value = readPath(idPath, entity);

        if (value == null) {
            return undefined;
        }

        writePath(idPath, id, value);
    }

    return id;
}
