import { Class } from "@entity-space/utils";
import { CriterionShape } from "./criterion-shape";
import { OrCriterion } from "./or-criterion";

export class OrCriterionShape extends CriterionShape<OrCriterion> {
    constructor(shapes: CriterionShape[]) {
        super();
        this.#shapes = Object.freeze(shapes.slice());
    }

    readonly #shapes: readonly CriterionShape[];
    override readonly type = "or";

    getShapes(): readonly CriterionShape[] {
        return this.#shapes;
    }

    override getCriterionType(): Class<OrCriterion> {
        return OrCriterion;
    }

    override toString(): string {
        return `(${this.#shapes.map(shape => shape.toString()).join(" | ")})`;
    }
}
