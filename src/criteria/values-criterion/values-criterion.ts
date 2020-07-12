import { IntersectValuesCriterion } from "./intersect-values-criterion";
import { SubsetValuesCriterion } from "./subset-values-criterion";
import { SupersetValuesCriterion } from "./superset-values-criterion";

export type ValuesCriterion
    = IntersectValuesCriterion
    | SubsetValuesCriterion
    | SupersetValuesCriterion;

export module ValuesCriterion {
    const operations: Record<ValuesCriterion["op"], true> = {
        "intersect": true,
        "subset": true,
        "superset": true
    };

    const operationsSet = new Set(Object.keys(operations));

    export function is(x?: any): x is ValuesCriterion {
        return operationsSet.has(x?.op);
    }

    export function reduce(a: ValuesCriterion, b: ValuesCriterion): ValuesCriterion | null {
        return reducer(a.op)(a, b);
    }

    export function reducer<OP extends ValuesCriterion["op"]>(op: OP): (a: Extract<ValuesCriterion, { op: OP }>, b: ValuesCriterion) => ValuesCriterion | null {
        switch (op) {
            case "intersect":
            case "subset":
            case "superset":
            default: throw new Error(`no reducer known for operation '${op}'`);
        }
    }
}
