import { StringIndexable } from "../utils";
import { Criterion } from "./criterion";
import { isValueCriteria, filterByValueCriteria } from "./value-criterion";

export function filterByCriterion<T extends StringIndexable>(instances: T[], criterion: Criterion): T[] {
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
