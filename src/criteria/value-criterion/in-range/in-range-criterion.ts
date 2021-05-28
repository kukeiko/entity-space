export interface InRangeCriterion {
    op: "range";
    // making this nullable instead of voidable might help in code complexity, as jasmine tester sees a difference in not-existing property vs. property set to void 0 (which makes sense)
    // doing it only to satisfy jasmine might be not good enough of an idea, so maybe we find more reasons to do it.
    from?: {
        op: ">=" | ">";
        value: number | string;
    };
    to?: {
        op: "<=" | "<";
        value: number | string;
    };
}
