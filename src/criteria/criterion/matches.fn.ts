import { PropertyCriteria, CriterionBag } from "./property-criteria";

export function matches<T>(bag: CriterionBag): PropertyCriteria<T> {
    return new PropertyCriteria(bag);
}
