import { Criterion } from "../criterion/criterion";
import { SomeCriterion } from "../criterion/some/some.criterion";
import { ICriterionShape } from "./criterion-shape.interface";
import { ReshapedCriterion } from "./reshaped-criterion";

export class SomeCriterionShape<T extends ICriterionShape> implements ICriterionShape<SomeCriterion> {
    constructor(item: T) {
        this.item = item;
    }

    private readonly item: T;

    reshape(criterion: Criterion): false | ReshapedCriterion<SomeCriterion> {
        if (!(criterion instanceof SomeCriterion)) {
            return false;
        }

        const result = this.item.reshape(criterion.getItem());

        if (result === false) {
            return false;
        }

        const remapped = result.getReshaped().map(criterion => new SomeCriterion(criterion));
        const open = result.getOpen().map(open => new SomeCriterion(open));

        return new ReshapedCriterion(remapped, open);
    }

    matches(criterion: Criterion): criterion is SomeCriterion {
        return criterion instanceof SomeCriterion;
    }

    toString(): string {
        return `some: ${this.item.toString()}`;
    }
}
