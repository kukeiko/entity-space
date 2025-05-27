import { Criterion } from "../criterion";
import { OrCriterion } from "../or-criterion";
import { subtractCriterion } from "./subtract-criterion.fn";

export function subtractByOrCriterion(orCriterion: OrCriterion, what: Criterion): boolean | Criterion {
    let subtracted = what;

    for (const mine of orCriterion.getCriteria()) {
        const result = subtractCriterion(subtracted, mine);

        if (result === true) {
            return true;
        } else if (result !== false) {
            subtracted = result;
        }
    }

    return subtracted === what ? false : subtracted;
}
