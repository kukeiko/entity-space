import { EntityRelationSelection } from "../../selection/entity-selection";
import { Entity } from "../entity";
import { EntitySchema } from "../entity-schema";
import { relationEntries } from "../relation-entries.fn";

export function writeRelationJoins(
    schema: EntitySchema,
    entities: readonly Entity[],
    selection: EntityRelationSelection,
): void {
    if (!entities.length) {
        return;
    }

    for (const [relation, relatedSchema, relationSelection] of relationEntries(schema, selection)) {
        if (relation.isJoined()) {
            relation.writeJoins(entities);
        }

        writeRelationJoins(relatedSchema, relation.readValuesFlat(entities), relationSelection);
    }
}
