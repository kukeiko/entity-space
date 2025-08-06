import { entryValueIs, isDefined } from "@entity-space/utils";
import { EntitySelection, PackedEntitySelection } from "./entity-selection";

function selectionToStringCore(
    selection: EntitySelection | PackedEntitySelection,
    pretty: number | false = false,
    visited = new Set<EntitySelection | PackedEntitySelection>(),
): string {
    visited.add(selection);
    const newLine = pretty !== false ? `\n${"    ".repeat(pretty)}` : " ";
    const endLine = pretty !== false ? `\n${"    ".repeat(pretty - 1)}` : " ";
    
    return `{${newLine}${Object.entries(selection)
        .filter(entryValueIs(isDefined))
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([key, value]) => {
            if (value === true) {
                return key;
            } else if (value === "*" || visited.has(value)) {
                return `${key}: *`;
            } else {
                return `${key}: ${selectionToStringCore(value, pretty !== false ? pretty + 1 : false, visited)}`;
            }
        })
        .join(`,${newLine}`)}${endLine}}`;
}

export function selectionToString(selection: EntitySelection | PackedEntitySelection, pretty = false): string {
    return selectionToStringCore(selection, pretty ? 1 : false);
}
