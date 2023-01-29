import { Null } from "@entity-space/utils";
import { Criterion } from "../criterion";
import { NotValueCriterion } from "./not-value-criterion";

export function notValue(value: number | string | boolean | null): Criterion {
    if (typeof value == "number") {
        return new NotValueCriterion([Number], value);
    } else if (typeof value == "string") {
        return new NotValueCriterion([String], value);
    } else if (typeof value === "boolean") {
        return new NotValueCriterion([Boolean], value);
    } else if (value === null) {
        return new NotValueCriterion([Null], value);
    }

    throw new Error(`invalid arguments`);
}
