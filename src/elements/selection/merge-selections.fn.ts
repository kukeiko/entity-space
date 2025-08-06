import { cloneSelection } from "./clone-selection.fn";
import { EntitySelection } from "./entity-selection";
import { mergeSelection } from "./merge-selection.fn";

export function mergeSelections(selections: readonly EntitySelection[]): EntitySelection {
    if (!selections.length) {
        return {};
    } else if (selections.length === 1) {
        return cloneSelection(selections[0]);
    }

    let merged: EntitySelection = {};

    for (let i = 0; i < selections.length; i += 2) {
        const [a, b] = [selections[i], selections[i + 1]];

        if (b === undefined) {
            merged = mergeSelection(merged, a);
        } else {
            merged = mergeSelection(a, b);
        }
    }

    return merged;
}
