import { InNumberRangeCriterion } from "./in-number-range-criterion";
import { InStringRangeCriterion } from "./in-string-range-criterion";

function isStringOrVoid(value: unknown): value is string | undefined {
    return value === void 0 || typeof value === "string";
}

function isNumberOrVoid(value: unknown): value is number | undefined {
    return value === void 0 || typeof value === "number";
}

export function inRange(from?: number | [value: number, inclusive: boolean], to?: number | [value: number, inclusive: boolean]): InNumberRangeCriterion;
export function inRange(from?: string | [string, boolean], to?: string | [string, boolean]): InStringRangeCriterion;
// export function inRange(from?: number, to?: number, inclusive?: boolean | [boolean, boolean]): InNumberRangeCriterion;
// export function inRange(from?: string, to?: string, inclusive?: boolean | [boolean, boolean]): InStringRangeCriterion;
export function inRange<T extends number | string>(
    from?: T | [T, boolean],
    to?: T | [T, boolean]
    // inclusive?: boolean | [boolean, boolean]
): InNumberRangeCriterion | InStringRangeCriterion {
    const fromValue = Array.isArray(from) ? from[0] : from;
    const toValue = Array.isArray(to) ? to[0] : to;
    let fromInclusive = true;
    let toInclusive = true;

    // if (typeof inclusive === "boolean") {
    //     fromInclusive = inclusive;
    //     toInclusive = inclusive;
    // } else if (Array.isArray(inclusive)) {
    //     fromInclusive = inclusive[0];
    //     toInclusive = inclusive[1];
    // } else {
    if (Array.isArray(from)) {
        fromInclusive = from[1];
    }

    if (Array.isArray(to)) {
        toInclusive = to[1];
    }
    // }

    if (fromValue === void 0 && toValue === void 0) {
        throw new Error(`from & to can't both be undefined`);
    } else if (isStringOrVoid(fromValue) && isStringOrVoid(toValue)) {
        return new InStringRangeCriterion([fromValue, toValue], [fromInclusive, toInclusive]);
    } else if (isNumberOrVoid(fromValue) && isNumberOrVoid(toValue)) {
        return new InNumberRangeCriterion([fromValue, toValue], [fromInclusive, toInclusive]);
    }

    throw new Error(`invalid arguments`);
}
