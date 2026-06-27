import { Class } from "@entity-space/utils";
import { CriterionShape } from "./criterion-shape";
import { SomeCriterion } from "./some-criterion";

export class SomeCriterionShape extends CriterionShape<SomeCriterion> {
    constructor(shape: CriterionShape) {
        super();
        this.#shape = shape;
    }

    readonly #shape: CriterionShape;
    override readonly type = "some";

    getShape(): CriterionShape {
        return this.#shape;
    }

    override getCriterionType(): Class<SomeCriterion> {
        return SomeCriterion;
    }

    override toString(): string {
        return `some(${this.#shape.toString()})`;
    }
}
