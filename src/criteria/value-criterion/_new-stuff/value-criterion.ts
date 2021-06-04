import { ValueCriteria } from "../value-criteria";

export interface ValueCriterion<T> {
    valueType: () => T;
    reduce(other: ValueCriterion<T>): ValueCriterion<T>[] | false;
    reduce(other: ValueCriterion<unknown>): ValueCriterion<ReturnType<typeof other["valueType"]>>[] | false;
    invert(): ValueCriterion<T>[];
    toString(): string;
}
