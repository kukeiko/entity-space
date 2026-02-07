import { Entity, EntityRelationSelection, EntitySchema, relationEntries } from "@entity-space/elements";
import { EntityChangesBuilder } from "../entity-changes-builder";

export function addChangeRelations(
    builder: EntityChangesBuilder,
    schema: EntitySchema,
    selection: EntityRelationSelection,
    entities: readonly Entity[],
): void {
    for (const [relation, relatedSchema, selected] of relationEntries(schema, selection)) {
        const tuples = relation.readTuples(entities);

        if (!tuples.length) {
            continue;
        }

        for (const [entity, relatedEntities] of tuples) {
            for (const related of relatedEntities) {
                builder.addRelation(relation, entity, related);
            }
        }

        const related = tuples.flatMap(tuple => tuple[1]);
        addChangeRelations(builder, relatedSchema, selected, related);
    }
}
