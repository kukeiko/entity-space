export interface IntersectValuesCriterion {
    op: "intersect";
    values: Set<boolean | number | string | null>;
}
