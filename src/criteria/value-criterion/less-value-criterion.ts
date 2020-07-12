export interface LessValueCriterion {
    op: "<";
    value: number | string;
}

export module LessValueCriterion {
    export function create<V extends LessValueCriterion["value"]>(value: V): LessValueCriterion {
        return { op: "<", value: value };
    }
}
