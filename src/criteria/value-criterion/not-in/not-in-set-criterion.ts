export interface NotInSetCriterion {
    op: "not-in";
    values: Set<boolean | number | string | null>;
}
