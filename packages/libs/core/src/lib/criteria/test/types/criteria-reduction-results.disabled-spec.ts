// import { inRange, inSet, isTrue, notInSet } from "../../criterion";

// // InRange
// {
//     const inNumberRange_reduce_inNumberRange = inRange(1, 7).reduce(inRange(1, 7));
//     // $ExpectType boolean | InNumberRangeCriterion | OrCriteria<InNumberRangeCriterion>
//     type InNumberRange_Reduce_InNumberRange = typeof inNumberRange_reduce_inNumberRange;

//     const inStringRange_reduce_inStringRange = inRange("a", "z").reduce(inRange("a", "z"));
//     // $ExpectType boolean | InStringRangeCriterion | OrCriteria<InStringRangeCriterion>
//     type InStringRange_Reduce_InStringRange = typeof inStringRange_reduce_inStringRange;
// }

// // InSet
// {
//     // Number
//     {
//         const inNumberSet_reduce_inNumberSet = inSet([1, 2, 3]).reduce(inSet([1, 2, 3]));
//         // $ExpectType boolean | InNumberSetCriterion
//         type InNumberSet_Reduce_InNumberSet = typeof inNumberSet_reduce_inNumberSet;

//         const inNumberSet_reduce_notInNumberSet = inSet([1, 2, 3]).reduce(notInSet([1, 2, 3]));
//         // $ExpectType boolean | NotInNumberSetCriterion
//         type InNumberSet_Reduce_NotInNumberSet = typeof inNumberSet_reduce_notInNumberSet;

//         const inNumberSet_reduce_inNumberRange = inSet([1, 2, 3]).reduce(inRange(1, 7));
//         // $ExpectType boolean | InNumberRangeCriterion
//         type InNumberSet_Reduce_InNumberRange = typeof inNumberSet_reduce_inNumberRange;
//     }

//     // String
//     {
//         const inStringSet_reduce_inStringSet = inSet(["foo", "bar", "baz"]).reduce(inSet(["foo", "bar", "baz"]));
//         // $ExpectType boolean | InStringSetCriterion
//         type InStringSet_Reduce_InStringSet = typeof inStringSet_reduce_inStringSet;

//         const inStringSet_reduce_notInStringSet = inSet(["foo", "bar", "baz"]).reduce(notInSet(["foo", "bar", "baz"]));
//         // $ExpectType boolean | NotInStringSetCriterion
//         type InNumberSet_Reduce_NotInNumberSet = typeof inStringSet_reduce_notInStringSet;

//         const inStringSet_reduce_inStringRange = inSet(["foo", "bar", "baz"]).reduce(inRange("a", "z"));
//         // $ExpectType boolean | InStringRangeCriterion
//         type InNumberSet_Reduce_InNumberRange = typeof inStringSet_reduce_inStringRange;
//     }
// }

// // NotInSet
// {
//     // Number
//     {
//         const notInNumberSet_reduce_notInNumberSet = notInSet([1, 2, 3]).reduce(notInSet([1, 2, 3]));
//         // $ExpectType boolean | InNumberSetCriterion
//         type NotInNumberSet_Reduce_NotInNumberSet = typeof notInNumberSet_reduce_notInNumberSet;

//         const notInNumberSet_reduce_inNumberSet = notInSet([1, 2, 3]).reduce(inSet([1, 2, 3]));
//         // $ExpectType boolean | InNumberSetCriterion
//         type NotInNumberSet_Reduce_InNumberSet = typeof notInNumberSet_reduce_inNumberSet;
//     }

//     // String
//     {
//         const notInStringSet_reduce_notInStringSet = notInSet(["foo", "bar", "baz"]).reduce(
//             notInSet(["foo", "bar", "baz"])
//         );
//         // $ExpectType boolean | InStringSetCriterion
//         type NotInStringSet_Reduce_NotInStringSet = typeof notInStringSet_reduce_notInStringSet;

//         const notInStringSet_reduce_inStringSet = notInSet(["foo", "bar", "baz"]).reduce(inSet(["foo", "bar", "baz"]));
//         // $ExpectType boolean | InStringSetCriterion
//         type NotInStringSet_Reduce_InStringSet = typeof notInStringSet_reduce_inStringSet;
//     }
// }

// // Binary
// {
//     // [todo] doesn't work yet
//     // const isTrue_reduce_isTrue = isTrue(true).reduce(isTrue(true));
//     // // $ExpectType true
//     // type IsTrue_Reduce_IsTrue = typeof isTrue_reduce_isTrue;
//     // const isTrue_reduce_isFalse = isTrue(true).reduce(isTrue(false));
//     // // $ExpectType false
//     // type IsTrue_Reduce_IsFalse = typeof isTrue_reduce_isFalse;
// }
