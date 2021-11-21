import { Selection } from "./selection";
import { copySelection } from "./copy-selection";

export function mergeSelections(...selections: Selection[]): Selection {
    const merged: Selection = {};

    for (const selection of selections) {
        for (const key in selection) {
            const left = merged[key];
            const right = selection[key];

            if (right === void 0) {
                continue;
            }

            if (left === void 0 || left === true) {
                if (right === true) {
                    merged[key] = true;
                } else {
                    merged[key] = copySelection(right);
                }
            } else if (right !== true) {
                merged[key] = mergeSelections(left, right);
            }
        }
    }

    return merged;
}
