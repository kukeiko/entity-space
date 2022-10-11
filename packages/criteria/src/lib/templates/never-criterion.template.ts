import { AnyCriterion } from "../criterion/any/any";
import { Criterion } from "../criterion/criterion";
import { NeverCriterion } from "../criterion/never/never";
import { ICriterionTemplate } from "./criterion-template.interface";
import { RemapCriterionResult } from "./remap-criterion-result";

export class NeverCriterionTemplate implements ICriterionTemplate<AnyCriterion> {
    remap(criterion: Criterion): false | RemapCriterionResult<AnyCriterion> {
        if (criterion instanceof NeverCriterion) {
            return new RemapCriterionResult([criterion]);
        }

        return false;
    }

    matches(criterion: Criterion): criterion is Criterion {
        return criterion instanceof NeverCriterion;
    }

    toString(): string {
        return "never";
    }
}
