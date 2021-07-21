import { EntityCriterion } from "./entity-criterion";
import { ValueCriterion } from "./value-criterion";

export function matches<T>(bag: Partial<Record<keyof T, ValueCriterion>>): EntityCriterion<T> {
    return new EntityCriterion(bag);
}
