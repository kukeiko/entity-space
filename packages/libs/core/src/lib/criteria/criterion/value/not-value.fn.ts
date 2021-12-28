import { NotNumberValueCriterion } from "./not-number-value-criterion";
import { NotStringValueCriterion } from "./not-string-value-criterion";

export function notValue(value: number): NotNumberValueCriterion;
export function notValue(value: string): NotStringValueCriterion;
export function notValue(value: number | string): NotNumberValueCriterion | NotStringValueCriterion {
    if (typeof value == "number") {
        return new NotNumberValueCriterion(value);
    } else if (typeof value == "string") {
        return new NotStringValueCriterion(value);
    }

    throw new Error(`invalid arguments`);
}
