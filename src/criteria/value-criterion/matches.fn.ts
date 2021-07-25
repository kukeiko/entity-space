import { EntityCriterion } from "./entity-criterion";
import { Criterion } from "./criterion";

export function matches<T>(bag: Partial<Record<keyof T, Criterion>>): EntityCriterion<T> {
    return new EntityCriterion(bag);
}
