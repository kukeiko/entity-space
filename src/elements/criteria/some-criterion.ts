import { Criterion } from "./criterion";

export class SomeCriterion extends Criterion {
    constructor(criterion: Criterion) {
        super();
        this.#criterion = criterion;
    }

    override readonly type = "some";
    readonly #criterion: Criterion;

    getCriterion(): Criterion {
        return this.#criterion;
    }

    override contains(value: unknown): boolean {
        if (!Array.isArray(value)) {
            return false;
        }

        return value.some(item => this.#criterion.contains(item));
    }

    override toString(): string {
        return `some(${this.#criterion.toString()})`;
    }
}
