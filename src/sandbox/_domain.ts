// import { Component } from "./component";
// import { Property } from "./property";
// import { Type } from "./type";

// export type ConstructionOptions<T> = {
//     [K in Component.Property.Keys<T>]
//     : ConstructionOptions.ChildrenOptions<T[K]>
//     & ConstructionOptions.ReferenceOptions<T[K]>
//     & ConstructionOptions.ReferenceIdOptions<T[K]>
//     ;
// };

// export module ConstructionOptions {
//     export type ChildrenOptions<X> = X extends Property.Children<infer K, infer T, infer P, infer A>
//         ? {
//             parentIdKey: P;
//         } : {};

//     export type ReferenceOptions<X> = X extends Property.Reference<infer K, infer T, infer P, infer A>
//         ? {
//             localIdKey: P["key"];
//         } & ModifierOptions<X> : {};

//     export type ReferenceIdOptions<X> = X extends Property.Reference.Id<infer K, infer T, infer P, infer A, infer M>
//         ? {
//             otherKey: T["$"]["key"];
//             otherIdKey: P;
//         } & ModifierOptions<X> : {};

//     export type ModifierOptions<X> = X extends Component.Property<infer K, infer V, infer M>
//         ? (
//             ("p" extends M ? { options: { p: true; }; } : {})
//             & ("c" extends M ? { options: { c: true; }; } : {})
//             & ("n" extends M ? { options: { n: true; }; } : {})
//         ) : {};
// }
