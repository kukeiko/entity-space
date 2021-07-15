import { NumberRangeCriterion } from "./number-range-criterion";
import { StringRangeCriterion } from "./string-range-criterion";

function isStringOrVoid(value: unknown): value is string | undefined {
    return value === void 0 || typeof value === "string";
}

function isNumberOrVoid(value: unknown): value is number | undefined {
    return value === void 0 || typeof value === "number";
}

export function inRange(from?: number, to?: number, inclusive?: boolean | [boolean, boolean]): NumberRangeCriterion;
export function inRange(from?: string, to?: string, inclusive?: boolean | [boolean, boolean]): StringRangeCriterion;
export function inRange<T extends number | string>(from?: T, to?: T, inclusive?: boolean | [boolean, boolean]): NumberRangeCriterion | StringRangeCriterion {
    if (from === void 0 && to === void 0) {
        throw new Error(`from & to can't both be undefined`);
    } else if (isStringOrVoid(from) && isStringOrVoid(to)) {
        return new StringRangeCriterion([from, to], inclusive);
    } else if (isNumberOrVoid(from) && isNumberOrVoid(to)) {
        return new NumberRangeCriterion([from, to], inclusive);
    }

    throw new Error(`invalid arguments`);
}
