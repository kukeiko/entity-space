export interface InSetCriterion {
    op: "in";
    values: Set<boolean | number | string | null>;
}
