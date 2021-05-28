import { InSetCriterion } from "./in-set-criterion";

export function inSet<V extends boolean | number | string | null>(values: Iterable<V>): InSetCriterion {
    return { op: "in", values: new Set(values) };
}
