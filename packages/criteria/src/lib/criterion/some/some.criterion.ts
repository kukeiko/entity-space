import { Criterion } from "../criterion";

export class SomeCriterion<T extends Criterion = Criterion> extends Criterion {
    constructor(criterion: T) {
        super();
        this.criterion = criterion;
    }

    private readonly criterion: T;

    reduce(other: Criterion): boolean | Criterion {
        const reduced = this.criterion.reduce(other);

        if (typeof reduced == "boolean") {
            return reduced;
        }

        return new SomeCriterion(reduced);
    }

    toString(): string {
        return `some(${this.criterion})`;
    }

    matches(value: any): boolean {
        if (!Array.isArray(value)) {
            return false;
        }

        return value.some(item => this.criterion.matches(item));
    }

    getItem(): T {
        return this.criterion;
    }
}
