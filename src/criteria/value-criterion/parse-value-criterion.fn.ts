import { or } from "./or.fn";
import { inRange } from "./range";
import { inSet, notInSet } from "./set";
import { ValueCriterion } from "./value-criterion";

function parseNumber(str: string): number | null {
    const parsed = parseFloat(str);
    if (!isNaN(parsed)) return parsed;

    return null;
}

const inRangePattern = /(\(|\[)(([-+]?\d*\.?\d*)|\.{3}), *(([-+]?\d*\.?\d*)|\.{3})(\)|\])/;
const inSetPattern = /!?\{(.*)\}/;

export function parseCriteria(str: string): ValueCriterion {
    const orCombinedShards = str.split(" | ");
    const criteria: ValueCriterion[] = [];

    for (const shard of orCombinedShards) {
        let matches = inRangePattern.exec(shard);

        if (matches !== null) {
            const inclusive: [boolean, boolean] = [matches[1] === "(" ? false : true, matches[6] === ")" ? false : true];
            const rawValues = [matches[2], matches[4]];
            const parsedValues: any[] = [void 0, void 0];

            if (rawValues[0] !== "...") {
                parsedValues[0] = parseNumber(rawValues[0]) ?? rawValues[0];
            }

            if (rawValues[1] !== "...") {
                parsedValues[1] = parseNumber(rawValues[1]) ?? rawValues[1];
            }

            criteria.push(inRange(parsedValues[0], parsedValues[1], inclusive));
        } else if ((matches = inSetPattern.exec(shard)) !== null) {
            const values = matches[1].split(",").map(value => value.trim());
            const firstValueParsedAsNumber = parseNumber(values[0]);
            const createSet = shard[0] === "!" ? notInSet : inSet;

            if (firstValueParsedAsNumber === null) {
                criteria.push(createSet(values));
            } else {
                criteria.push(createSet(values.map(value => parseInt(value, 10))));
            }
        } else {
            throw new Error("invalid/unsupported syntax");
        }
    }

    if (criteria.length === 1) {
        return criteria[0];
    } else {
        return or(criteria);
    }
}
