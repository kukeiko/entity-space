// import { ValueCriteria } from "./value-criteria";

// export function filterByValueCriteria<T extends Record<string, any>>(instances: T[], key: string, criteria: ValueCriteria): T[] {
//     const filtered = new Set<T>();

//     for (const criterion of criteria) {
//         let matches: (instance: T) => boolean = () => false;

//         switch (criterion.op) {
//             case "in":
//                 matches = instance => criterion.values.has(instance[key]);
//                 break;

//             default:
//                 throw new Error(`criterion op '${criterion.op}' not yet supported`);
//         }

//         for (const instance of instances) {
//             if (matches(instance)) {
//                 filtered.add(instance);
//             }
//         }
//     }

//     return Array.from(filtered.values());
// }
