import { NotInValueCriterion } from "./not-in-value-criterion";

export function createNotInValueCriterion<V extends boolean | number | string | null>(values: Iterable<V>): NotInValueCriterion {
    return { op: "not-in", values: new Set(values) };
}
