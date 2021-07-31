export abstract class Criterion {
    invert(): false | Criterion {
        return false;
    }

    abstract reduce(other: Criterion): boolean | Criterion;
    abstract toString(): string;
}
