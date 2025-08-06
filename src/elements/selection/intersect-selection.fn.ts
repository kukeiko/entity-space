import { EntitySelection } from "./entity-selection";
import { omitEmptySelections } from "./omit-empty-selections.fn";

function intersectSelectionCore(
    a: EntitySelection,
    b: EntitySelection,
    visited: Map<EntitySelection, [EntitySelection, EntitySelection]> = new Map(),
): EntitySelection {
    const intersection: EntitySelection = {};
    visited.set(a, [b, intersection]);

    for (const key in a) {
        const valueA = a[key];
        const valueB = b[key];

        if (valueB === undefined) {
            continue;
        } else if (typeof valueA !== typeof valueB) {
            throw new Error(`intersection between incompatible selections on key ${key}`);
        } else if (valueA !== true && valueB !== true) {
            if (visited.get(valueA)?.[0] === valueB) {
                intersection[key] = visited.get(valueA)![1];
            } else {
                intersection[key] = intersectSelectionCore(valueA, valueB, visited);
            }
        } else {
            intersection[key] = true;
        }
    }

    return intersection;
}

export function intersectSelection(a: EntitySelection, b: EntitySelection): EntitySelection | false {
    const intersected = intersectSelectionCore(a, b);
    omitEmptySelections(intersected);

    return Object.keys(intersected).length ? intersected : false;
}
