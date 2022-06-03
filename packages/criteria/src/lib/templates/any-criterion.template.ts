import { AnyCriterion } from "../criterion/any/any";
import { Criterion } from "../criterion/criterion";
import { ICriterionTemplate } from "./criterion-template.interface";
import { RemapCriterionResult } from "./remap-criterion-result";

export class AnyCriterionTemplate implements ICriterionTemplate<AnyCriterion> {
    remap(criterion: Criterion): false | RemapCriterionResult<AnyCriterion> {
        return new RemapCriterionResult([criterion]);
    }

    matches(criterion: Criterion): criterion is Criterion {
        return true;
    }
}
