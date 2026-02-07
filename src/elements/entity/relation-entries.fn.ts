import { EntityRelationSelection } from "../selection/entity-selection";
import { EntityRelationProperty } from "./entity-relation-property";
import { EntitySchema } from "./entity-schema";

export function relationEntries(
    schema: EntitySchema,
    selection: EntityRelationSelection,
): [EntityRelationProperty, EntitySchema, EntityRelationSelection][] {
    return Object.entries(selection).map(([key, selected]) => {
        const relation = schema.getRelation(key);
        const relatedSchema = relation.getRelatedSchema();

        return [relation, relatedSchema, selected];
    });
}
