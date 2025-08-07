import { isEqual } from "lodash";
import { EntitySelection } from "./entity-selection";
import { omitEmptySelections } from "./omit-empty-selections.fn";

function subtractSelectionCore(
    what: EntitySelection,
    by: EntitySelection,
    visited: Map<EntitySelection, [EntitySelection, EntitySelection]> = new Map(),
): EntitySelection {
    const subtracted: EntitySelection = {};
    visited.set(what, [by, subtracted]);

    for (const key in what) {
        const valueWhat = what[key];
        const valueBy = by[key];

        if (valueBy === undefined) {
            subtracted[key] = valueWhat;
        } else if (typeof valueWhat !== typeof valueBy) {
            throw new Error(`subtraction between incompatible selections on key ${key}`);
        } else if (valueWhat !== true && valueBy !== true) {
            if (visited.get(valueWhat)?.[0] === valueBy) {
                subtracted[key] = visited.get(valueWhat)![1];
            } else {
                subtracted[key] = subtractSelectionCore(valueWhat, valueBy, visited);
            }
        }
    }

    return subtracted;
}

export function subtractSelection(what: EntitySelection, by: EntitySelection): EntitySelection | boolean {
    const subtracted = subtractSelectionCore(what, by);
    omitEmptySelections(subtracted);

    return Object.keys(subtracted).length ? (isEqual(what, subtracted) ? false : subtracted) : true;
}
