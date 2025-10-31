import { CriterionShape } from "./criterion-shape";

export class ReshapedCriterionShape<T extends CriterionShape = CriterionShape> {
    constructor(reshaped: T, open?: CriterionShape, flattenCount = 0) {
        this.#reshaped = reshaped;
        this.#open = open;
        this.#flattenCount = flattenCount;
    }

    readonly #reshaped: T;
    readonly #open?: CriterionShape;
    readonly #flattenCount: number;

    getReshaped(): T {
        return this.#reshaped;
    }

    getOpen(): CriterionShape | undefined {
        return this.#open;
    }

    getFlattenCount(): number {
        return this.#flattenCount;
    }
}
