import { entryValueIs, isDefined } from "@entity-space/utils";
import { EntitySelection, PackedEntitySelection } from "./entity-selection";

function selectionToStringCore(
    selection: EntitySelection | PackedEntitySelection,
    visited = new Set<EntitySelection | PackedEntitySelection>(),
): string {
    visited.add(selection);

    return `{ ${Object.entries(selection)
        .filter(entryValueIs(isDefined))
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([key, value]) => {
            if (value === true) {
                return key;
            } else {
                return `${key}: ${visited.has(value) ? "*" : selectionToStringCore(value, visited)}`;
            }
        })
        .join(", ")} }`;
}

export function selectionToString(selection: EntitySelection | PackedEntitySelection): string {
    return selectionToStringCore(selection);
}
