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

    return selections.reduce((previous, current) => {
        return mergeSelection(previous, current);
    }, merged);
}
