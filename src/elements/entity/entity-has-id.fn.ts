import { readPath } from "@entity-space/utils";
import { Entity } from "./entity";
import { EntitySchema } from "./entity-schema";

export function entityHasId(schema: EntitySchema, entity: Entity): boolean {
    if (!schema.hasId()) {
        return false;
    }

    for (const idPath of schema.getLeadingIdPaths()) {
        if (readPath(idPath, entity) == null) {
            return false;
        }
    }

    const value = readPath<undefined | null | number | string>(schema.getLastIdPath(), entity);

    if (value == null || (typeof value == "number" && value < 0) || (typeof value == "string" && value < "0")) {
        return false;
    }

    return true;
}
