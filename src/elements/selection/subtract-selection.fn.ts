import { isEqual } from "lodash";
import { EntitySelection } from "./entity-selection";

function hasNonRecursiveProperties(selection: EntitySelection, visited = new Set<EntitySelection>()): boolean {
    for (const value of Object.values(selection)) {
        if (typeof value === "boolean") {
            return true;
        } else if (visited.has(value)) {
            continue;
        } else {
            visited.add(value);

            if (hasNonRecursiveProperties(value, visited)) {
                return true;
            }
        }
    }

    return false;
}

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

function omitEmptySelections(selection: EntitySelection, visited = new Set<EntitySelection>()): void {
    for (const [key, value] of Object.entries(selection)) {
        if (typeof value === "boolean" || visited.has(value)) {
            continue;
        } else if (!hasNonRecursiveProperties(value)) {
            delete selection[key];
        } else if (!visited.has(value)) {
            visited.add(value);
            omitEmptySelections(value, visited);
        }
    }
}

export function subtractSelection(what: EntitySelection, by: EntitySelection): EntitySelection | boolean {
    const subtracted = subtractSelectionCore(what, by);
    omitEmptySelections(subtracted);

    return Object.keys(subtracted).length ? (isEqual(what, subtracted) ? false : subtracted) : true;
}
