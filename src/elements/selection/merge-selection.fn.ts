import { cloneSelection } from "./clone-selection.fn";
import { EntitySelection } from "./entity-selection";

function mergeSelectionCore(
    a: EntitySelection,
    b: EntitySelection,
    visited: Map<EntitySelection, [EntitySelection, EntitySelection]> = new Map(),
): EntitySelection {
    const merged: EntitySelection = {};
    visited.set(a, [b, merged]);

    for (const selection of [a, b]) {
        for (const [key, right] of Object.entries(selection)) {
            const left = merged[key];

            if (left === undefined) {
                if (right === true) {
                    merged[key] = true;
                } else {
                    const cloned = cloneSelection(right);

                    if (visited.has(right)) {
                        visited.set(cloned, visited.get(right)!);
                    }

                    merged[key] = cloned;
                }
            } else if (typeof left !== typeof right) {
                throw new Error(`merge between incompatible selections on key ${key}`);
            } else if (left !== true && right !== true) {
                if (visited.get(left)?.[0] === right) {
                    merged[key] = visited.get(left)![1];
                } else {
                    merged[key] = mergeSelectionCore(left, right, visited);
                }
            } else {
                merged[key] = true;
            }
        }
    }

    return merged;
}

export function mergeSelection(a: EntitySelection, b: EntitySelection): EntitySelection {
    return mergeSelectionCore(a, b);
}
