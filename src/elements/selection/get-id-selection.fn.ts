import { writePath } from "@entity-space/utils";
import { EntitySchema } from "../entity/entity-schema";
import { EntityRelationSelection, EntitySelection } from "./entity-selection";

export function getIdSelection(schema: EntitySchema, relationSelection?: EntityRelationSelection): EntitySelection {
    const selection: EntitySelection = {};

    for (const idPath of schema.getIdPaths()) {
        writePath(idPath, selection, true);
    }

    if (relationSelection !== undefined) {
        for (const [key, value] of Object.entries(relationSelection)) {
            const relatedSchema = schema.getRelation(key).getRelatedSchema();
            selection[key] = getIdSelection(relatedSchema, value);
        }
    }

    return selection;
}
