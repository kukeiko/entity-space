export interface LessEqualsValueCriterion {
    op: "<=";
    value: number | string;
}

export module LessEqualsValueCriterion {
    export function create<V extends LessEqualsValueCriterion["value"]>(value: V): LessEqualsValueCriterion {
        return { op: "<=", value: value };
    }
}
