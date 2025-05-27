import { Criterion } from "./criterion";

export class OrCriterion extends Criterion {
    constructor(criteria: readonly Criterion[]) {
        super();
        this.#criteria = Object.freeze(criteria.slice());
    }

    override readonly type = "or";
    readonly #criteria: readonly Criterion[];

    getCriteria(): readonly Criterion[] {
        return this.#criteria;
    }

    override contains(value: unknown): boolean {
        return this.#criteria.some(criterion => criterion.contains(value));
    }

    override toString(): string {
        return `(${this.#criteria.map(criterion => criterion.toString()).join(" | ")})`;
    }
}
