import { Path, toPath, toPathSegments } from "@entity-space/utils";
import { EntitySchema } from "../entity/entity-schema";
import { EntitySelection } from "./entity-selection";

function toPathedRelatedSchemasCore(
    selection: EntitySelection,
    schema: EntitySchema,
    visited: Set<EntitySelection>,
    path?: Path,
): [Path, EntitySchema][] {
    if (visited.has(selection)) {
        return [];
    }

    visited.add(selection);
    const entityPaths: [Path, EntitySchema][] = [];

    for (const [key, value] of Object.entries(selection)) {
        if (value === true || !schema.isRelation(key)) {
            continue;
        }

        if (visited.has(value)) {
            continue;
        }

        const relation = schema.getRelation(key);
        const relatedSchema = relation.getRelatedSchema();
        const thisPath = path ? toPath([...toPathSegments(path), key].join(".")) : toPath(key);
        entityPaths.push([thisPath, relatedSchema]);
        entityPaths.push(
            ...toPathedRelatedSchemasCore(
                selection[key] as EntitySelection,
                relation.getRelatedSchema(),
                visited,
                thisPath,
            ),
        );
    }

    return entityPaths;
}

export function selectionToPathedRelatedSchemas(
    schema: EntitySchema,
    selection: EntitySelection,
): [Path, EntitySchema][] {
    return toPathedRelatedSchemasCore(selection, schema, new Set());
}
