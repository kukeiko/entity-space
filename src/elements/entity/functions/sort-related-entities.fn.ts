import { isEmpty } from "lodash";
import { EntityRelationSelection } from "../../selection/entity-selection";
import { Entity } from "../entity";
import { EntitySchema } from "../entity-schema";
import { relationEntries } from "../relation-entries.fn";

export function sortRelatedEntities(
    schema: EntitySchema,
    selection: EntityRelationSelection,
    entities: readonly Entity[],
): void {
    if (!entities.length) {
        return;
    }

    for (const [relation, relatedSchema, relationSelection] of relationEntries(schema, selection)) {
        const sorter = schema.getSorter();

        if (relation.isArray()) {
            for (const entity of entities) {
                const value = relation.readValue(entity);

                if (Array.isArray(value) && sorter) {
                    value.sort(sorter);
                }
            }
        }

        if (!isEmpty(relationSelection)) {
            const related = relation.readValuesFlat(entities);
            sortRelatedEntities(relatedSchema, relationSelection, related);
        }
    }
}
