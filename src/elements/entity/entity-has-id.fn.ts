import { readPath } from "@entity-space/utils";
import { Entity } from "./entity";
import { EntitySchema } from "./entity-schema";

function isValidIdValue(value: string | number | null | undefined): boolean {
    return !(
        value == null ||
        (typeof value == "number" && value <= 0) ||
        (typeof value == "string" && (value <= "0" || value === ""))
    );
}

export function entityHasId(schema: EntitySchema, entity: Entity): boolean {
    if (!schema.hasId()) {
        return false;
    }

    return schema.getIdPaths().every(idPath => isValidIdValue(readPath(idPath, entity)));
}
