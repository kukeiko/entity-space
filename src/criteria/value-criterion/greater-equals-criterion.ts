export interface GreaterEqualsValueCriterion {
    op: ">=";
    value: number | string;
}

export module GreaterEqualsValueCriterion {
    export function create<V extends GreaterEqualsValueCriterion["value"]>(value: V): GreaterEqualsValueCriterion {
        return { op: ">=", value: value };
    }
}
