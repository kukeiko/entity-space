import { EntitySchema } from "../entity/entity-schema";
import { EntityRelationSelection, EntitySelection } from "./entity-selection";

export function toRelationSelection(schema: EntitySchema, selection: EntitySelection): EntityRelationSelection {
    const relationSelection: EntityRelationSelection = {};

    for (const [key, value] of Object.entries(selection)) {
        if (!schema.isRelation(key)) {
            continue;
        } else if (value === true) {
            throw new Error("invalid selection");
        }

        const relation = schema.getRelation(key);
        relationSelection[key] = toRelationSelection(relation.getRelatedSchema(), value);
    }

    return relationSelection;
}
