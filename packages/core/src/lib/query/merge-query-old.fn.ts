// import { or } from "@entity-space/criteria";
// import { reduceExpansion } from "../expansion";
// import { Query } from "./query";

// // [todo] kept for reference for when i want to implement query widening
// export function mergeQuery_old(a: Query, b: Query): false | Query[] {
//     if (a.getEntitySchema().getId() !== b.getEntitySchema().getId()) {
//         return false;
//     }

//     const mergedCriteria = a.getCriteria().merge(b.getCriteria());
//     const expandReduced_A_by_B = reduceExpansion(a.getExpansionObject(), b.getExpansionObject());
//     const expandReduced_B_by_A = reduceExpansion(b.getExpansionObject(), a.getExpansionObject());

//     const aIsSubsetOfB = expandReduced_A_by_B !== false && Object.keys(expandReduced_A_by_B).length === 0;
//     const bIsSubsetOfA = expandReduced_B_by_A !== false && Object.keys(expandReduced_B_by_A).length === 0;

//     if (aIsSubsetOfB && bIsSubsetOfA && mergedCriteria === false) {
//         const query = new Query(a.getEntitySchema(), or(a.getCriteria(), b.getCriteria()), a.getExpansionObject());
//         return [query];
//     }

//     if (mergedCriteria === false) {
//         return false;
//     }

//     // commented out the rest during changing Query from being an interface to a class because i was too lazy

//     // if (aIsSubsetOfB && bIsSubsetOfA) {
//     //     // equal expansion
//     //     return [
//     //         {
//     //             criteria: mergedCriteria,
//     //             getEntitySchema(): a.getEntitySchema(),
//     //             expansion: a.expansion,
//     //         },
//     //     ];
//     // } else if (aIsSubsetOfB) {
//     //     if (a.criteria.reduce(b.criteria) === true && b.criteria.reduce(a.criteria) === true) {
//     //         // equal criteria
//     //         return [
//     //             {
//     //                 criteria: mergedCriteria,
//     //                 getEntitySchema(): a.getEntitySchema(),
//     //                 expansion: b.expansion,
//     //             },
//     //         ];
//     //     } else if (b.criteria.reduce(a.criteria) === true) {
//     //         return [
//     //             {
//     //                 criteria: mergedCriteria,
//     //                 getEntitySchema(): a.getEntitySchema(),
//     //                 expansion: b.expansion,
//     //             },
//     //         ];
//     //     }

//     //     return [
//     //         {
//     //             criteria: mergedCriteria,
//     //             getEntitySchema(): a.getEntitySchema(),
//     //             expansion: a.expansion,
//     //         },
//     //         b,
//     //     ];
//     // } else if (bIsSubsetOfA) {
//     //     if (a.criteria.reduce(b.criteria) === true && b.criteria.reduce(a.criteria) === true) {
//     //         // equal criteria
//     //         return [
//     //             {
//     //                 criteria: mergedCriteria,
//     //                 getEntitySchema(): a.getEntitySchema(),
//     //                 expansion: a.expansion,
//     //             },
//     //         ];
//     //     } else if (a.criteria.reduce(b.criteria) === true) {
//     //         return [
//     //             {
//     //                 criteria: mergedCriteria,
//     //                 getEntitySchema(): b.getEntitySchema(),
//     //                 expansion: a.expansion,
//     //             },
//     //         ];
//     //     }

//     //     return [
//     //         {
//     //             criteria: mergedCriteria,
//     //             getEntitySchema(): b.getEntitySchema(),
//     //             expansion: b.expansion,
//     //         },
//     //         a,
//     //     ];
//     // } else {
//     //     return false;
//     // }

//     return false;
// }
