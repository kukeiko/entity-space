export abstract class ValueCriterion<T = unknown> {
    temp!: T; // need this for proper type-safety, otherwise ValueCriterion<number> is assignable to ValueCriterion<string>
    abstract reduce(other: ValueCriterion): false | ValueCriterion<T>[];
    abstract invert(): ValueCriterion<T>[];
    abstract toString(): string;
}
