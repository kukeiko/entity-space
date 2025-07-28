import { EntitySchema } from "../entity/entity-schema";
import { EntitySelection } from "./entity-selection";
import { getIdSelection } from "./get-id-selection.fn";
import { mergeSelection } from "./merge-selection.fn";
import { toRelationSelection } from "./to-relation-selection.fn";

export function addIdSelection(schema: EntitySchema, selection: EntitySelection): EntitySelection {
    const idSelection = getIdSelection(schema, toRelationSelection(schema, selection));

    return mergeSelection(idSelection, selection);
}
