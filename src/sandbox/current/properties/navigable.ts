import { Box } from "../lang";
import { Instance } from "../instance";
import { Property } from "../property";
// import { Type } from "../type";

// [todo] using "T extends Type<any>" might be a gud thing mon. try out later.
// export type Navigable<T extends Type<any>, V, K extends string, A extends string = K> = Property.Dto<V, K, A, Box<Instance.Dto<T>, V>> & {
export type Navigable<T, V, K extends string, A extends string = K> = Property<V, K, A, Box<Instance.Dto<T>, V>> & {
    navigable: true;
    navigated: T;
};

export module Navigable {
    export type Keys<T> = Exclude<{ [P in keyof T]: T[P] extends Navigable<infer _1, infer _2, infer _3> | undefined ? P : never }[keyof T], undefined>;
    export type OtherType<N> = N extends Navigable<infer T, infer _2, infer _3> ? T : never;
}
