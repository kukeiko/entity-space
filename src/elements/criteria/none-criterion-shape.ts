import { Class } from "@entity-space/utils";
import { CriterionShape } from "./criterion-shape";
import { NoneCriterion } from "./none-criterion";

export class NoneCriterionShape extends CriterionShape<NoneCriterion> {
    constructor(shape: CriterionShape) {
        super();
        this.#shape = shape;
    }

    readonly #shape: CriterionShape;
    override readonly type = "none";

    getShape(): CriterionShape {
        return this.#shape;
    }

    override getCriterionType(): Class<NoneCriterion> {
        return NoneCriterion;
    }

    override toString(): string {
        return `none(${this.#shape.toString()})`;
    }
}
