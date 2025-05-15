import { cloneSelection } from "./clone-selection.fn.mjs";
import { EntitySelection } from "./entity-selection.mjs";

export function mergeSelections(selections: EntitySelection[]): EntitySelection {
    const merged: EntitySelection = {};

    for (const selection of selections) {
        for (const [key, right] of Object.entries(selection)) {
            const left = merged[key];

            if (left === undefined) {
                if (right === true) {
                    merged[key] = right;
                } else {
                    merged[key] = cloneSelection(right);
                }
            } else if (typeof left !== typeof right) {
                throw new Error(`merge between incompatible selections on key ${key}`);
            } else if (left === true && right === true) {
                merged[key] = true;
            } else {
                merged[key] = mergeSelections([left as EntitySelection, right as EntitySelection]);
            }
        }
    }

    return merged;
}
