import { CriterionShape } from "./criterion-shape";

export class ReshapedCriterionShape<T extends CriterionShape = CriterionShape> {
    constructor(reshaped: T, open?: CriterionShape) {
        this.#reshaped = reshaped;
        this.#open = open;
    }

    readonly #reshaped: T;
    readonly #open?: CriterionShape;

    getReshaped(): T {
        return this.#reshaped;
    }

    getOpen(): CriterionShape | undefined {
        return this.#open;
    }
}
