import { Criterion } from "../criterion";
import { SomeCriterion } from "./some.criterion";

export function some(criterion: Criterion): Criterion {
    return new SomeCriterion(criterion);
}
