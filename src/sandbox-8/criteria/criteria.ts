import { Criterion } from "./criterion";
import { SetCriterion } from "./set-criterion";

export interface Criteria {
    // [k: string]: Criterion | Criterion[] | SetCriterion | SetCriterion[] | Criteria | Criteria[];
    [k: string]: Criterion[] | SetCriterion[] | Criteria[];
}
