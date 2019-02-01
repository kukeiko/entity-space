import { Box, Unbox } from "../lang";
import { Instance } from "../instance";
import { Property } from "../property";
// import { Type } from "../type";

// [todo] using "T extends Type<any>" might be a gud thing mon. try out later.
// export type Navigable<T extends Type<any>, V, K extends string, A extends string = K> = Property.Dto<V, K, A, Box<Instance.Dto<T>, V>> & {
export type Navigable<
    T,
    // V,
    K extends string,
    A extends string = K,
    U = Unbox<Exclude<T, null>>> = {
        navigable: true;
        // navigated: T;
        // navigated: Unbox<Exclude<T, null>>;
        navigated: U;
    } & Property<Box<Instance<U>, T>, K, A, Box<Instance.Dto<U>, T>>;
// } & Property<Box<Instance<Unbox<Exclude<T, null>>>, T>, K, A, Box<Instance.Dto<Unbox<Exclude<T, null>>>, T>>;
// } & Property<V, K, A, Box<Instance.Dto<T>, V>>;

export module Navigable {
    export type Keys<T> = Exclude<{ [P in keyof T]: T[P] extends Navigable<infer _1, infer _2, infer _3, infer _4> | undefined ? P : never }[keyof T], undefined>;
    export type OtherType<N> = N extends Navigable<infer T, infer _2, infer _3> ? T : never;
}

type Foo = (number[] | null);
type Bar = Unbox<Exclude<Foo, null>>;
