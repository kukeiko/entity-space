import { EntitySelection } from "./entity-selection.mjs";
import { subtractSelection } from "./subtract-selection.fn.mjs";

export function isSelectionSubsetOf(what: EntitySelection, of: EntitySelection): boolean {
    return subtractSelection(what, of) === true;
}
