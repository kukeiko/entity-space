export abstract class Criterion {
    invert(): false | Criterion {
        return false;
    }

    merge(other: Criterion): false | Criterion {
        return false;
    }

    intersect(other: Criterion): false | Criterion {
        return false;
    }

    abstract reduce(other: Criterion): boolean | Criterion;
    abstract toString(): string;
}
