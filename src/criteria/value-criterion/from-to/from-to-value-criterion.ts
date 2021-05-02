export interface FromToValueCriterion {
    op: "from-to";
    from?: {
        op: ">=" | ">";
        value: number | string;
    };
    to?: {
        op: "<=" | "<";
        value: number | string;
    };
}
