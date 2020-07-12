import { ValueCriterion } from "./value-criterion";

export interface NotEqualsValueCriterion {
    op: "!=";
    value: boolean | number | string | null;
}

export module NotEqualsValueCriterion {
    export function create<V extends NotEqualsValueCriterion["value"]>(value: V): NotEqualsValueCriterion {
        return { op: "!=", value: value };
    }

    /**
     * [todo] unfinished - will do later since it is one of the less
     * important criteria.
     */
    export function reduce(a: NotEqualsValueCriterion, b: ValueCriterion): ValueCriterion | null {
        switch (b.op) {
            case "!=": return a.value === b.value ? null : b;
            case "==": return a.value === b.value ? b : null;
            default: return b;
        }
    }
}
