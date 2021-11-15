import { IsNumberValueCriterion } from "./is-number-value-criterion";
import { IsStringValueCriterion } from "./is-string-value-criterion";

export function isValue(value: number): IsNumberValueCriterion;
export function isValue(value: string): IsStringValueCriterion;
export function isValue(value: number | string): IsNumberValueCriterion | IsStringValueCriterion {
    if (typeof value == "number") {
        return new IsNumberValueCriterion(value);
    } else if (typeof value == "string") {
        return new IsStringValueCriterion(value);
    }

    throw new Error(`invalid arguments`);
}
