import { EntitySelection, PackedEntitySelection } from "./entity-selection";

export function reshapeSelection(shape: PackedEntitySelection, selection: EntitySelection): PackedEntitySelection {
    const reshaped: PackedEntitySelection = {};

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
            } else {
                reshaped[key] = reshapeSelection(shapeValue, value);
            }
        }
    }

    return reshaped;
}
