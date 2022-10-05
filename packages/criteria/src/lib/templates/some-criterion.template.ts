import { Criterion } from "../criterion/criterion";
import { SomeCriterion } from "../criterion/some/some.criterion";
import { ICriterionTemplate } from "./criterion-template.interface";
import { RemapCriterionResult } from "./remap-criterion-result";

export class SomeCriterionTemplate<T extends ICriterionTemplate> implements ICriterionTemplate<SomeCriterion> {
    constructor(item: T) {
        this.item = item;
    }

    private readonly item: T;

    remap(criterion: Criterion): false | RemapCriterionResult<SomeCriterion> {
        if (!(criterion instanceof SomeCriterion)) {
            return false;
        }

        const result = this.item.remap(criterion.getItem());

        if (result === false) {
            return false;
        }

        const remapped = result.getCriteria().map(criterion => new SomeCriterion(criterion));
        const open = result.getOpen().map(open => new SomeCriterion(open));

        return new RemapCriterionResult(remapped, open);
    }

    matches(criterion: Criterion): criterion is SomeCriterion {
        return criterion instanceof SomeCriterion;
    }

    toString(): string {
        return `some: ${this.item.toString()}`;
    }
}
