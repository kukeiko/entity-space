import { EntitySelection } from "./entity-selection";
import { intersectSelection } from "./intersect-selection.fn";

export function intersectSelections(selections: readonly EntitySelection[]): EntitySelection | false {
    let [intersected, ...others] = [selections[0], ...selections];

    for (const selection of others) {
        const next = intersectSelection(intersected, selection);

        if (next === false) {
            return false;
        }

        intersected = next;
    }

    return intersected;
}
