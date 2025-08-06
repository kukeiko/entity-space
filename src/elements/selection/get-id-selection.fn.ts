import { writePath } from "@entity-space/utils";
import { EntitySchema } from "../entity/entity-schema";
import { EntityRelationSelection, EntitySelection } from "./entity-selection";

// [todo] [recursive] ❌ should need adaptation, but mutation test using recursion don't fail yet.
// need to come up with a test case where it does fail.
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
