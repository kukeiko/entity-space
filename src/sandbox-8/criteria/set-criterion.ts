export interface SetCriterion {
    op: "intersect" | "subset" | "superset";
    values: Set<boolean | number | string | null>;
}
