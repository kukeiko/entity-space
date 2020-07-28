import { StringIndexable } from "../utils";
import { Criteria } from "./criteria";
import { filterByCriterion } from "./filter-by-criterion";

export function filterByCriteria<T extends StringIndexable>(instances: T[], criteria: Criteria): T[] {
    if (criteria.length === 0) {
        return instances;
    }

    const allFiltered = new Set<T>();

    for (const criterion of criteria) {
        const filtered = filterByCriterion(instances, criterion);

        for (const instance of filtered) {
            allFiltered.add(instance);
        }
    }

    return Array.from(allFiltered.values());
}
