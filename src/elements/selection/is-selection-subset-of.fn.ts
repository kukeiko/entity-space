import { EntitySelection } from "./entity-selection";
import { subtractSelection } from "./subtract-selection.fn";

export function isSelectionSubsetOf(what: EntitySelection, of: EntitySelection): boolean {
    return subtractSelection(what, of) === true;
}
