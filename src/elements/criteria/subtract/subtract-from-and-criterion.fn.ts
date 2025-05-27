import { AndCriterion } from "../and-criterion";
import { Criterion } from "../criterion";
import { subtractCriterion } from "./subtract-criterion.fn";

export function subtractFromAndCriterion(andCriterion: AndCriterion, by: Criterion): boolean | Criterion {
    const items: Criterion[] = [];
    let didSubtractAny = false;

    for (const mine of andCriterion.getCriteria()) {
        const subtracted = subtractCriterion(mine, by);

        if (subtracted === true) {
            return true;
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

    return items.length === 1 ? items[0] : new AndCriterion(items);
}
