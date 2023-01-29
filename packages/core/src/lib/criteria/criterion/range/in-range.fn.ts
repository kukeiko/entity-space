import { any } from "../any/any.fn";
import { Criterion } from "../criterion";
import { InNumberRangeCriterion } from "./in-number-range-criterion";
import { InStringRangeCriterion } from "./in-string-range-criterion";

function isStringOrVoid(value: unknown): value is string | undefined {
    return value === void 0 || typeof value === "string";
}

function isNumberOrVoid(value: unknown): value is number | undefined {
    return value === void 0 || typeof value === "number";
}

export function inRange(from?: number, to?: number, inclusive?: boolean | [boolean, boolean]): Criterion;
export function inRange(from?: string, to?: string, inclusive?: boolean | [boolean, boolean]): Criterion;
export function inRange<T extends number | string>(
    from?: T,
    to?: T,
    inclusive?: boolean | [boolean, boolean]
): Criterion {
    if (from === void 0 && to === void 0) {
        return any();
    } else if (isStringOrVoid(from) && isStringOrVoid(to)) {
        return new InStringRangeCriterion([from, to], inclusive);
    } else if (isNumberOrVoid(from) && isNumberOrVoid(to)) {
        return new InNumberRangeCriterion([from, to], inclusive);
    }

    throw new Error(`invalid arguments`);
}
