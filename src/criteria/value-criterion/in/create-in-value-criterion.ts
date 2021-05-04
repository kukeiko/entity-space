import { InValueCriterion } from "./in-value-criterion";

export function createInValueCriterion<V extends boolean | number | string | null>(values: Iterable<V>): InValueCriterion {
    return { op: "in", values: new Set(values) };
}
