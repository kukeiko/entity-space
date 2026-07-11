import { isEmpty } from "lodash";
import { EntityRelationSelection } from "../../selection/entity-selection";
import { Entity } from "../entity";
import { relationEntries } from "../relation-entries.fn";
import { EntitySchema } from "../schema/entity-schema";

export function sortRelatedEntities(
    schema: EntitySchema,
    selection: EntityRelationSelection,
    entities: readonly Entity[],
): void {
    if (!entities.length) {
        return;
    }

    for (const [relation, relatedSchema, relationSelection] of relationEntries(schema, selection)) {
        const sorter = relatedSchema.getSorter();

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
