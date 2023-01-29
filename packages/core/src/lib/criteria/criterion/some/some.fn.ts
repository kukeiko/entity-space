import { AnyCriterion } from "../any/any";
import { any } from "../any/any.fn";
import { Criterion } from "../criterion";
import { SomeCriterion } from "./some.criterion";

export function some(criterion: Criterion): Criterion {
    if (criterion instanceof AnyCriterion) {
        return any();
    }

    return new SomeCriterion(criterion);
}
