import { Class } from "@entity-space/utils";
import { AndCriterion } from "./and-criterion";
import { CriterionShape } from "./criterion-shape";

export class AndCriterionShape extends CriterionShape<AndCriterion> {
    constructor(shapes: CriterionShape[]) {
        super();
        this.#shapes = Object.freeze(shapes.slice());
    }

    readonly #shapes: readonly CriterionShape[];
    override readonly type = "and";

    getShapes(): readonly CriterionShape[] {
        return this.#shapes;
    }

    override getCriterionType(): Class<AndCriterion> {
        return AndCriterion;
    }

    override toString(): string {
        return `(${this.#shapes.map(shape => shape.toString()).join(" & ")})`;
    }
}
