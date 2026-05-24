import { EntitySelection } from "./entity-selection";

export function isRecursiveSelection(selection: EntitySelection, seen = new Set<EntitySelection>()): boolean {
    for (const value of Object.values(selection)) {
        if (typeof value === "object") {
            if (seen.has(value)) {
                return true;
            }

            seen.add(value);

            if (isRecursiveSelection(value, seen)) {
                return true;
            }
        }
    }

    return false;
}
