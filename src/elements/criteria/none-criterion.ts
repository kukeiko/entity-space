import { Criterion } from "./criterion";

export class NoneCriterion extends Criterion {
    constructor(criterion: Criterion) {
        super();
        this.#criterion = criterion;
    }

    override readonly type = "none";
    readonly #criterion: Criterion;

    getCriterion(): Criterion {
        return this.#criterion;
    }

    override contains(value: unknown): boolean {
        if (!Array.isArray(value)) {
            return false;
        }

        return value.every(item => !this.#criterion.contains(item));
    }

    override toString(): string {
        return `none(${this.#criterion.toString()})`;
    }
}
