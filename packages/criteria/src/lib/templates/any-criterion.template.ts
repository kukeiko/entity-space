import { AnyCriterion } from "../criterion/any/any";
import { Criterion } from "../criterion/criterion";
import { OrCriteria } from "../criterion/or/or-criteria";
import { ICriterionTemplate } from "./criterion-template.interface";
import { RemapCriterionResult } from "./remap-criterion-result";
import { remapOrCriteria } from "./remap-or-criteria.fn";

export class AnyCriterionTemplate implements ICriterionTemplate<AnyCriterion> {
    remap(criterion: Criterion): false | RemapCriterionResult<AnyCriterion> {
        if (criterion instanceof AnyCriterion) {
            return new RemapCriterionResult([criterion]);
        } else if (criterion instanceof OrCriteria) {
            return remapOrCriteria(this, criterion);
        }

        return false;
    }

    matches(criterion: Criterion): criterion is AnyCriterion {
        return criterion instanceof AnyCriterion;
    }
}
