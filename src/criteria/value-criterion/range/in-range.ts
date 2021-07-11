import { DateRangeCriterion } from "./date-range-criterion";
import { NumberRangeCriterion } from "./number-range-criterion";
import { RangeCriterion } from "./range-criterion";
import { StringRangeCriterion } from "./string-range-criterion";

// [todo] would be interesting to know if we should return the common base class instead, so as to not leak too much about internals?
export function inRange_Generic_Return<T extends number | string>(from?: T | [T, boolean], to?: T | [T, boolean], format?: "date"): RangeCriterion<T> {
    return "foo" as any;
}

function isStringOrVoid(value: unknown): value is string | undefined {
    return value === void 0 || typeof value === "string";
}

function isNumberOrVoid(value: unknown): value is number | undefined {
    return value === void 0 || typeof value === "number";
}

// [todo] consider implementing "integer" | "float" formats
// export function inRange(from?: number | [number, boolean], to?: number | [number, boolean], format?: "integer" | "float"): InNumberRangeCriterion;
export function inRange(from?: number, to?: number, inclusive?: boolean | [boolean, boolean]): NumberRangeCriterion;
export function inRange(from?: string, to?: string, inclusive?: boolean | [boolean, boolean]): StringRangeCriterion;
export function inRange(from?: string, to?: string, inclusive?: boolean | [boolean, boolean], format?: "date"): DateRangeCriterion;
export function inRange<T extends number | string>(
    from?: T,
    to?: T,
    inclusive?: boolean | [boolean, boolean],
    format?: "date"
): NumberRangeCriterion | StringRangeCriterion | DateRangeCriterion {
    if (from === void 0 && to === void 0) {
        throw new Error(`from & to can't both be undefined`);
    } else if (isStringOrVoid(from) && isStringOrVoid(to)) {
        if (format === "date") {
            return new DateRangeCriterion([from, to], inclusive);
        }

        return new StringRangeCriterion([from, to], inclusive);
    } else if (isNumberOrVoid(from) && isNumberOrVoid(to)) {
        return new NumberRangeCriterion([from, to], inclusive);
    }

    throw new Error(`invalid arguments`);
}
