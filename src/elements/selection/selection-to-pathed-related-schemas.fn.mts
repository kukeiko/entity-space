import { EntitySchema } from "@entity-space/schema";
import { Path, toPath, toPathSegments } from "@entity-space/utils";
import { EntitySelection } from "./entity-selection.mjs";

function toPathedRelatedSchemasCore(
    selection: EntitySelection,
    schema: EntitySchema,
    path?: Path,
): [Path, EntitySchema][] {
    const entityPaths: [Path, EntitySchema][] = [];

    for (const [key, value] of Object.entries(selection)) {
        if (value === true || !schema.isRelation(key)) {
            continue;
        }

        const relatedSchema = schema.getRelation(key).getRelatedSchema();
        const thisPath = path ? toPath([...toPathSegments(path), key].join(".")) : toPath(key);
        entityPaths.push([thisPath, relatedSchema]);
        entityPaths.push(...toPathedRelatedSchemasCore(value, relatedSchema, thisPath));
    }

    return entityPaths;
}

export function selectionToPathedRelatedSchemas(
    schema: EntitySchema,
    selection: EntitySelection,
): [Path, EntitySchema][] {
    return toPathedRelatedSchemasCore(selection, schema);
}
