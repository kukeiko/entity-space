import { Criterion } from "../criterion";
import { IsValueCriterion } from "./is-value-criterion";

const allowedTypes = ["number", "string", "boolean"];
export function isValue(value: number | string | boolean | null): Criterion {
    if (value !== null && !allowedTypes.includes(typeof value)) {
        throw new Error(`invalid value type for value: ${value}`);
    }

    return new IsValueCriterion(value);
}
