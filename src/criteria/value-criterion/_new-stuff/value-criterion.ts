import { ValueCriteria } from "../value-criteria";

export interface ValueCriterion<T> {
    valueType: () => T;
    reduce(other: ValueCriterion<unknown>): ValueCriterion<ReturnType<typeof other["valueType"]>>[] | false;
}
