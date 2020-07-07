export interface NotInValueCriterion {
    op: "not-in";
    values: Set<boolean | number | string | null>;
}

export module NotInValueCriterion {
    export function create<V extends boolean | number | string | null>(values: Iterable<V>): NotInValueCriterion {
        return { op: "not-in", values: new Set(values) };
    }
}
