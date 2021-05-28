import { ValueCriterion } from "./value-criterion";

const operations: Record<ValueCriterion["op"], true> = {
    "range": true,
    "not-in": true,
    in: true,
};

const operationsSet = new Set(Object.keys(operations));

export function isValueCriterion(x?: any): x is ValueCriterion {
    return operationsSet.has(x?.op);
}
