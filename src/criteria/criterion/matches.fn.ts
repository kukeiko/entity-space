import { Criterion } from "./criterion";
import { NamedCriteria } from "./named-criteria";

export function matches<T>(bag: Partial<Record<keyof T, Criterion>>): NamedCriteria {
    return new NamedCriteria(bag);
}
