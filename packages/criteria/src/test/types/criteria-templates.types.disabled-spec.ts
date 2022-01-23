// import { IsExact } from "conditional-type-checks";
// import {
//     InNumberRangeCriterion,
//     InNumberSetCriterion,
//     InstancedCriterionTemplate,
//     NamedCriteria,
//     OrCriteria,
//     OrCriteriaTemplate,
//     NamedCriteriaTemplate,
// } from "../../criterion";

// // [todo] comment out & fix
// // $ExpectType true
// type OrCriteria_OneItem = IsExact<
//     InstancedCriterionTemplate<OrCriteriaTemplate<[typeof InNumberRangeCriterion]>>,
//     OrCriteria<InNumberRangeCriterion>
// >;

// // $ExpectType true
// type OrCriteria_TwoItems = IsExact<
//     InstancedCriterionTemplate<OrCriteriaTemplate<[typeof InNumberRangeCriterion, typeof InNumberSetCriterion]>>,
//     OrCriteria<InNumberRangeCriterion | InNumberSetCriterion>
// >;

// // $ExpectType true
// type NamedCriteria_OneItem = IsExact<
//     InstancedCriterionTemplate<NamedCriteriaTemplate<{ foo: [typeof InNumberRangeCriterion] }>>,
//     NamedCriteria<{ foo: InNumberRangeCriterion }>
// >;

// // $ExpectType true
// type NamedCriteria_TwoItems = IsExact<
//     InstancedCriterionTemplate<
//         NamedCriteriaTemplate<{ foo: [typeof InNumberRangeCriterion]; bar: [typeof InNumberSetCriterion] }>
//     >,
//     NamedCriteria<{ foo: InNumberRangeCriterion; bar: InNumberSetCriterion }>
// >;

// // $ExpectType true
// type NamedCriteria_TwoItems_Nested = IsExact<
//     InstancedCriterionTemplate<
//         NamedCriteriaTemplate<{
//             foo: [typeof InNumberRangeCriterion, OrCriteriaTemplate<[typeof InNumberRangeCriterion]>];
//             bar: [typeof InNumberSetCriterion];
//         }>
//     >,
//     NamedCriteria<{ foo: InNumberRangeCriterion | OrCriteria<InNumberRangeCriterion>; bar: InNumberSetCriterion }>
// >;
