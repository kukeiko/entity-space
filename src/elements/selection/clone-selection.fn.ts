import { EntitySelection } from "./entity-selection";

export function cloneSelection(selection: EntitySelection): EntitySelection {
    return structuredClone(selection);
}
