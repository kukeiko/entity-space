export interface SupersetValuesCriterion {
    op: "superset";
    values: Set<boolean | number | string | null>;
}
