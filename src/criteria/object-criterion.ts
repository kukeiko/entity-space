// import { ObjectCriteria, ValueCriteria } from "./value-criterion";
// import { ValuesCriteria } from "./values-criterion";

// // [todo] i feel like this should be simplified to ObjectCriterion = ValueCriteria | ValuesCriteria | ObjectCriteria,
// // and we have a separated type for when we want it to be fully typed (based on a T)
// export type ObjectCriterion<T = any> = {
//     [K in keyof T]?: Exclude<T[K], undefined> extends boolean | number | string | null
//         ? ValueCriteria<T[K]>
//         : Exclude<T[K], undefined> extends (boolean | number | string | null)[]
//         ? ValuesCriteria
//         : ObjectCriteria<Exclude<T[K], undefined>>;
// };

// interface Shape {
//     id: number;
//     type: "square" | "circle";
//     children: Shape;
// }

// function ProducesSquareOrCircle(): "square" | "circle" {
//     return "square";
// }

// const shapeCriteria: ObjectCriterion<Shape> = {
//     type: new ValueCriteria(ProducesSquareOrCircle, []),
//     // children: new ObjectCriteria()
// };

// // type Criterion<T> = {
// //     // [K in Property.Keys<T, Attribute.IsFilterable>]?: T[K] extends Property & { value: Primitive } & Attribute.IsIterable
// //     [K in Property.Keys<T>]?: T[K] extends Property & { value: Primitive[] } & Attribute.IsIterable
// //         ? ValuesCriterion[]
// //         : T[K] extends Property & { value: Primitive[] }
// //         ? ValueCriterion[]
// //         : T[K] extends Property & { value: Class[] }
// //         ? Criterion<MergeUnion<Unbox<Unbox<T[K]["value"]>>>>[]
// //         : T[K] extends Property
// //         ? ValueCriterion[]
// //         : never;
// // };

// // /**
// //  * [todo] file name doesn't reflect name of type - can't fix it yet, as we have a "criteria" folder with the generic criteria stuff
// //  * current idea is to have the generic criteria stuff as a separate package, so we'd import from "@entity-space/criteria",
// //  * or even move it to a completely unrelated repository
// //  */
// // export type TypedCriteria<T> = Criterion<MergeUnion<T>>[];
