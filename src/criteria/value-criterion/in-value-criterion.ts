export interface InValueCriterion {
    op: "in";
    values: Set<boolean | number | string | null>;
}
