export abstract class Criterion {
    invert(): false | Criterion {
        return false;
    }

    // [todo] should return boolean | Criterion if we dont want empty criteria, because then we might also return true
    // reason: merging("(7, ...]").with("[..., 10)").shouldBe("[..., ...]");
    merge(other: Criterion): false | Criterion {
        return false;
    }

    intersect(other: Criterion): false | Criterion {
        return false;
    }

    abstract subtractFrom(other: Criterion): boolean | Criterion;
    abstract toString(): string;
    abstract matches(value: any): boolean;

    filter<T>(items: T[]): T[] {
        return items.filter(item => this.matches(item));
    }

    // [todo] test this
    equivalent(other: Criterion): boolean {
        return this.subtractFrom(other) === true && other.subtractFrom(this) === true;
    }
}
