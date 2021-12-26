import { Expansion } from "./expansion";
import { mergeExpansions } from "./merge-expansions.fn";

export function copyExpansion(expansion: Expansion): Expansion {
    return mergeExpansions(expansion, {});
}
