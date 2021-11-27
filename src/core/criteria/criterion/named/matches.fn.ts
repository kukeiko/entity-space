import { Criterion } from "../criterion";
import { NamedCriteria } from "./named-criteria";

/**
 * [todo] name is a bit unintuitive. it doesn't really reflect that we're creating named-criteria here.
 * however, named-criteria are an integral part for filtering entities, so it does have a reason to use
 * a very generic word. if we keep it, we just expect it to be part of the learning curve.
 */
export function matches<T>(bag: Partial<Record<keyof T, Criterion>>): NamedCriteria {
    return new NamedCriteria(bag);
}
