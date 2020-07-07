export interface GreaterValueCriterion {
    op: ">";
    value: number | string;
}

export module GreaterValueCriterion {
    export function create<V extends GreaterValueCriterion["value"]>(value: V): GreaterValueCriterion {
        return { op: ">", value: value };
    }
}
