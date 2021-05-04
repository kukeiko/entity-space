import { ObjectCriterion } from "./object-criterion";
import { isValueCriteria, filterByValueCriteria } from "./value-criterion";

export function filterByObjectCriterion<T extends Record<string, any>>(instances: T[], criterion: ObjectCriterion): T[] {
    let filtered: T[] = [];

    for (const propertyCriteriaKey in criterion) {
        const propertyCriteria = criterion[propertyCriteriaKey];

        if (isValueCriteria(propertyCriteria)) {
            filtered = filterByValueCriteria(instances, propertyCriteriaKey, propertyCriteria);
        } else {
            throw new Error(`as of yet only simple value criteria filtering is supported`);
        }
    }

    return filtered;
}
