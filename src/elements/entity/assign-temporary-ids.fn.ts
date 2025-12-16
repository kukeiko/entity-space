import { readPath, writePath } from "@entity-space/utils";
import { EntityRelationSelection } from "../selection/entity-selection";
import { Entity } from "./entity";
import { EntitySchema } from "./entity-schema";

export function assignTemporaryIds(
    schema: EntitySchema,
    selection: EntityRelationSelection,
    entities: readonly Entity[],
    startWith = -1,
): number {
    let nextId = startWith;

    if (schema.hasId()) {
        const lastIdPath = schema.getLastIdPath();
        const property = schema.getPrimitive(lastIdPath);

        for (const entity of entities) {
            if (readPath(lastIdPath, entity) == null) {
                nextId--;
                writePath(lastIdPath, entity, property.isString() ? nextId.toString() : nextId);
            }
        }
    }

    for (const [key, selected] of Object.entries(selection)) {
        const relation = schema.getRelation(key);
        const relatedSchema = relation.getRelatedSchema();

        for (const entity of entities) {
            const related = relation.readValueAsArray(entity);
            nextId = assignTemporaryIds(relatedSchema, selected, related, nextId);
        }

        relation.writeJoins(entities)
    }

    return nextId;
}
