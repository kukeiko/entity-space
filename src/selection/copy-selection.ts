import { Selection } from "./selection";
import { mergeSelections } from "./merge-selections";

export function copySelection(selection: Selection): Selection {
    return mergeSelections(selection, {});
}
