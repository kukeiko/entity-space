import { Selection } from "./selection";
import { mergeSelections } from "./merge-selections";

export function copySelection(selection: Selection.Untyped): Selection.Untyped {
    return mergeSelections(selection, {});
}
