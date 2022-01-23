import { Criterion } from "../criterion";
import { NamedCriteria, NamedCriteriaBag } from "./named-criteria";

/**
 * [todo] name is a bit unintuitive. it doesn't really reflect that we're creating named-criteria here.
 * however, named-criteria are an integral part for filtering entities, so it does have a reason to use
 * a very generic word. if we keep it, we just expect it to be part of the learning curve.
 */
export function matches<T>(bag: Partial<Record<keyof T, Criterion>>): NamedCriteria {
    return new NamedCriteria(bag);
}

// [todo] any
export function fromDeepBag(deepBag: any): NamedCriteria {
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
