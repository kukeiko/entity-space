import { ValueCriteria } from "../value-criteria";

export interface ValueCriterion<T> {
    valueType: () => T;
    reduce(other: ValueCriterion<T>): ValueCriterion<T>[]|false;
}
