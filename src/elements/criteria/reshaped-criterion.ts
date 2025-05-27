import { Criterion } from "./criterion";

export class ReshapedCriterion<T extends Criterion = Criterion> {
    constructor(reshaped: T[], open?: Criterion[]) {
        this.#reshaped = Object.freeze(reshaped.slice());
        this.#open = Object.freeze(open?.slice() ?? []);
    }

    readonly #reshaped: readonly T[];
    readonly #open: readonly Criterion[];

    getReshaped(): readonly T[] {
        return this.#reshaped;
    }

    getOpen(): readonly Criterion[] {
        return this.#open;
    }
}
