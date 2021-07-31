export abstract class Criterion {
    abstract reduce(other: Criterion): boolean | Criterion;
    abstract invert(): Criterion;
    abstract toString(): string;
}
