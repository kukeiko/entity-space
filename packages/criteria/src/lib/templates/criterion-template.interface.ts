import { Criterion } from "../criterion/criterion";
import { RemapCriterionResult } from "./remap-criterion-result";

export interface ICriterionTemplate<T extends Criterion = Criterion> {
    remap(criterion: Criterion): false | RemapCriterionResult<T>;
    matches(criterion: Criterion): criterion is T;
}
