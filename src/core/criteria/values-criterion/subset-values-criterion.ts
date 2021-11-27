export interface SubsetValuesCriterion {
    op: "subset";
    values: Set<boolean | number | string | null>;
}
