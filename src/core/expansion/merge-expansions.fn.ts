import { Expansion } from "./expansion";

export function mergeExpansions(...expansions: Expansion[]): Expansion {
    const merged: Expansion = {};

    for (const selection of expansions) {
        for (const key in selection) {
            const left = merged[key];
            const right = selection[key];

            if (right === void 0) {
                continue;
            }

            if (left === void 0 || left === true) {
                if (right === true) {
                    merged[key] = true;
                } else {
                    merged[key] = mergeExpansions(right);
                }
            } else if (right !== true) {
                merged[key] = mergeExpansions(left, right);
            }
        }
    }

    return merged;
}