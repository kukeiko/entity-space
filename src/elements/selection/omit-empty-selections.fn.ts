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

export function omitEmptySelections(selection: EntitySelection, visited = new Set<EntitySelection>()): void {
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
