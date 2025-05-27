import { EntitySelection } from "./entity-selection";
import { mergeSelections } from "./merge-selections.fn";

export function mergeSelection(a: EntitySelection, b: EntitySelection): EntitySelection {
    return mergeSelections([a, b]);
}
