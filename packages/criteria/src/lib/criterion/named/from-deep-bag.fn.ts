import { Criterion } from "../criterion";
import { matches } from "./matches.fn";
import { NamedCriteriaBag } from "./named-criteria";

// [todo] any
export function fromDeepBag(deepBag: any): Criterion {
    const bag: NamedCriteriaBag = {};

    for (const property in deepBag) {
        const bagOrCriterion = deepBag[property];

        if (bagOrCriterion instanceof Criterion) {
            bag[property] = bagOrCriterion;
        } else {
            bag[property] = fromDeepBag(bagOrCriterion);
        }
    }

    return matches(bag);
}
