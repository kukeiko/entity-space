import { EntityRelationProperty, EntitySchema, EntitySelection } from "@entity-space/elements";

export function getOpenEntityProperties(
    schema: EntitySchema,
    availableSelection: EntitySelection,
    openSelection: EntitySelection,
): EntityRelationProperty[] {
    const open: EntityRelationProperty[] = [];

    for (const [key, value] of Object.entries(openSelection)) {
        if (
            value === true ||
            availableSelection[key] ||
            !schema.isRelation(key) ||
            !schema.getRelation(key).isJoined()
        ) {
            continue;
        }

        open.push(schema.getRelation(key));
    }

    return open;
}
