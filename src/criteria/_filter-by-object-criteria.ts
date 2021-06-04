// import { ObjectCriteria } from "./object-criteria";
// import { filterByObjectCriterion } from "./_filter-by-object-criterion";

// export function filterByObjectCriteria<T extends Record<string, any>>(instances: T[], criteria: ObjectCriteria): T[] {
//     if (criteria.length === 0) {
//         return instances;
//     }

//     const allFiltered = new Set<T>();

//     for (const criterion of criteria) {
//         const filtered = filterByObjectCriterion(instances, criterion);

//         for (const instance of filtered) {
//             allFiltered.add(instance);
//         }
//     }

//     return Array.from(allFiltered.values());
// }
