import { EntitySelection, PackedEntitySelection } from "./entity-selection";

function reshapeSelectionCore(
    shape: PackedEntitySelection,
    selection: EntitySelection,
    visited: Map<EntitySelection, PackedEntitySelection>,
): PackedEntitySelection {
    const reshaped: PackedEntitySelection = {};
    visited.set(selection, reshaped);

    for (const [key, value] of Object.entries(selection)) {
        const shapeValue = shape[key];

        if (shapeValue === undefined) {
            continue;
        } else if (value === true) {
            if (shapeValue !== true) {
                throw new Error(`reshaping incompatible selection on key ${key}`);
            }

            reshaped[key] = true;
        } else {
            if (shapeValue === true) {
                reshaped[key] = true;
            } else if (shapeValue === "*") {
                if (visited.has(value)) {
                    reshaped[key] = "*";
                }
            } else {
                if (visited.has(value)) {
                    reshaped[key] = visited.get(value)!;
                } else {
                    reshaped[key] = reshapeSelectionCore(shapeValue, value, visited);
                }
            }
        }
    }

    return reshaped;
}

export function reshapeSelection(shape: PackedEntitySelection, selection: EntitySelection): PackedEntitySelection {
    return reshapeSelectionCore(shape, selection, new Map());
}
