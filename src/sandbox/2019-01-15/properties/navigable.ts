import { Box } from "../lang";
import { Instance } from "../instance";
import { Property } from "../property";

// export type Navigable<T, K extends string, A extends string = K, V = Box<Instance<Unbox<T>>, T>> = Property.Dto<V, K, A, Box<Instance.Dto<Unbox<T>>, T>> & {
export type Navigable<T, V, K extends string, A extends string = K> = Property.Dto<V, K, A, Box<Instance.Dto<T>, V>> & {
    navigable: true;
    otherType: T;
};

export module Navigable {
    export type Keys<T> = Exclude<{ [P in keyof T]: T[P] extends Navigable<infer _1, infer _2, infer _3> | undefined ? P : never }[keyof T], undefined>;
    export type OtherType<N> = N extends Navigable<infer T, infer _2, infer _3> ? T : never;
}
