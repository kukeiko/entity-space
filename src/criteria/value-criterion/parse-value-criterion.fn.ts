import { inRange } from "./range";
import { ValueCriterion } from "./value-criterion";

function parseNumber(str: string): number | null {
    const parsed = parseFloat(str);
    if (!isNaN(parsed)) return parsed;

    return null;
}

export function parseCriteria(str: string): ValueCriterion {
    const inRangePattern = /(\(|\[)(([-+]?\.\d+)|([-+]?\d+(\.\d+)?)|\.{3}), (([-+]?\.\d+)|([-+]?\d+(\.\d+)?)|\.{3})(\)|\])/;
    const matches = inRangePattern.exec(str);

    if (matches !== null) {
        const inclusive: [boolean, boolean] = [matches[1] === "(" ? false : true, matches[10] === ")" ? false : true];
        const rawValues = [matches[2], matches[6]];
        const parsedValues: any[] = [void 0, void 0];

        if (rawValues[0] !== "...") {
            parsedValues[0] = parseNumber(rawValues[0]) ?? rawValues[0];
        }

        if (rawValues[1] !== "...") {
            parsedValues[1] = parseNumber(rawValues[1]) ?? rawValues[1];
        }

        return inRange(parsedValues[0], parsedValues[1], inclusive);
    }

    /**
     * first find all "|" and "&" which are symbols reserved for the and/or combined value-criteria,
     * and from them first create a tree structure which contains the yet-to-be-parsed pieces that
     * each should be parseable to a single value-criterion (and not value-criteria)
     */
    throw new Error("invalid/unsupported syntax");
}
