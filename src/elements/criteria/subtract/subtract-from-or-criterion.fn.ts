import { Criterion } from "../criterion";
import { OrCriterion } from "../or-criterion";
import { subtractCriterion } from "./subtract-criterion.fn";

export function subtractFromOrCriterion(orCriterion: OrCriterion, by: Criterion): boolean | Criterion {
    const items: Criterion[] = [];
    let didSubtractAny = false;

    for (const mine of orCriterion.getCriteria()) {
        const subtracted = subtractCriterion(mine, by);

        if (subtracted === true) {
            didSubtractAny = true;
        } else if (subtracted !== false) {
            items.push(subtracted);
            didSubtractAny = true;
        } else {
            items.push(mine);
        }
    }

    if (!didSubtractAny) {
        return false;
    }

    return items.length === 0 ? true : items.length === 1 ? items[0] : new OrCriterion(items);
}
