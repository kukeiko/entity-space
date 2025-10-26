import { EntityRelationSelection } from "../selection/entity-selection";
import { Entity } from "./entity";
import { EntitySchema } from "./entity-schema";

export function writeRelationIds(
    schema: EntitySchema,
    entities: readonly Entity[],
    relationSelection: EntityRelationSelection,
): void {
    if (!entities.length) {
        return;
    }

    for (const relation of schema.getRelations()) {
        if (relation.isJoined()) {
            relation.writeIds(entities);
        }

        const selectedRelation = relationSelection[relation.getName()];

        if (selectedRelation !== undefined) {
            writeRelationIds(relation.getRelatedSchema(), relation.readValues(entities), selectedRelation);
        }
    }
}
