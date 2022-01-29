import { Criterion } from "../criterion";
import { IsValueCriterion } from "./is-value-criterion";

export function isValue(value: number | string | boolean | null): Criterion {
    return new IsValueCriterion(value);
}
