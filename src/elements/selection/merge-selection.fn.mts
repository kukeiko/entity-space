import { EntitySelection } from "./entity-selection.mjs";
import { mergeSelections } from "./merge-selections.fn.mjs";

export function mergeSelection(a: EntitySelection, b: EntitySelection): EntitySelection {
    return mergeSelections([a, b]);
}
