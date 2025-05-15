import { EntitySelection } from "./entity-selection.mjs";

export function cloneSelection(selection: EntitySelection): EntitySelection {
    return structuredClone(selection);
}
