import { readPath, writePath } from "@entity-space/utils";
import { EntityRelationSelection } from "../selection/entity-selection";
import { Entity } from "./entity";
import { EntitySchema } from "./entity-schema";
import { toEntityPairs } from "./to-entity-pairs.fn";

export function assignCreatedIds(
    schema: EntitySchema,
    selection: EntityRelationSelection,
    targets: readonly Entity[],
    sources: readonly Entity[],
): void {
    const pairs = toEntityPairs(schema, targets, sources);

    for (const [target, source] of pairs) {
        if (source === undefined) {
            continue;
        }

        for (const idPath of schema.getIdPaths()) {
            writePath(idPath, target, readPath(idPath, source));
        }

        for (const [key, selected] of Object.entries(selection)) {
            const relation = schema.getRelation(key);
            const relatedSchema = relation.getRelatedSchema();
            const targetRelated = relation.readValueAsArray(target);
            const sourceRelated = relation.readValueAsArray(source);
            assignCreatedIds(relatedSchema, selected[key] ?? {}, targetRelated, sourceRelated);
        }
    }
}
