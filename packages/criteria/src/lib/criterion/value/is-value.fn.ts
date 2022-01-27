import { Null } from "@entity-space/utils";
import { Criterion } from "../criterion";
import { IsValueCriterion } from "./is-value-criterion";

export function isValue(value: number | string | boolean | null): Criterion {
    if (typeof value == "number") {
        return new IsValueCriterion([Number], value);
    } else if (typeof value == "string") {
        return new IsValueCriterion([String], value);
    } else if (typeof value === "boolean") {
        return new IsValueCriterion([Boolean], value);
    } else if (value === null) {
        return new IsValueCriterion([Null], value);
    }

    throw new Error(`invalid arguments`);
}
