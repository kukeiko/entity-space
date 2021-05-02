export interface NotInValueCriterion {
    op: "not-in";
    values: Set<boolean | number | string | null>;
}
