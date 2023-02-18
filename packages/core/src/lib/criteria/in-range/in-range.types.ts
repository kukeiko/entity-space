export type FromCriterion<T> = {
    op: ">=" | ">";
    value: T;
};

export type ToCriterion<T> = {
    op: "<=" | "<";
    value: T;
};