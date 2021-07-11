export abstract class ValueCriterion<T = unknown> {
    temp!: T;
    abstract reduce(other: ValueCriterion): false | ValueCriterion<T>[];
    abstract invert(): ValueCriterion<T>[];
    abstract toString(): string;
}
