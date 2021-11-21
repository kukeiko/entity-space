import { Selection } from "./selection";
import { reduceSelection } from "./reduce-selection";

/**
 * Determines if a is a superset of b.
 */
export function isSelectionSupersetOf(a: Selection, b: Selection): boolean {
    /**
     * [todo] lazy implementation - it works, but we should have an algorithm that
     * exits early instead of making a full reduction, otherwise we'll have unnecessary cpu cycles,
     * and this method might be on the critical path.
     */
    return Object.keys(reduceSelection(b, a)).length == 0;
}
