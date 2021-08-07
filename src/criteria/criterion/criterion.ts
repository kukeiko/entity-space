export abstract class Criterion {
    invert(): false | Criterion {
        return false;
    }

    // [todo] should return boolean | Criterion if we dont want empty criteria
    // reason: merging("(7, ...]").with("[..., 10)").shouldBe("[..., ...]");
    merge(other: Criterion): false | Criterion {
        return false;
    }

    intersect(other: Criterion): false | Criterion {
        return false;
    }

    abstract reduce(other: Criterion): boolean | Criterion;
    abstract toString(): string;
}
