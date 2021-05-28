import { NotInSetCriterion } from "./not-in-set-criterion";

export function notInSet<V extends boolean | number | string | null>(values: Iterable<V>): NotInSetCriterion {
    return { op: "not-in", values: new Set(values) };
}
