import { Box, Unbox } from "../lang";
import { Instance } from "../instance";
import { Local } from "./local";
import { Navigable } from "./navigable";

export type Complex<T, K extends string, A extends string = K, V = Box<Instance<Unbox<T>>, T>> = {
    complex: true;
}
    & Local<V, K, A, Box<Instance.Dto<Unbox<T>>, T>>
    & Navigable<Unbox<T>, V, K, A>;

export module Complex {
    export type Keys<T> = keyof T & Exclude<{ [P in keyof T]: T[P] extends Complex<infer _1, infer K, infer _3, infer _4> | undefined ? K : never }[keyof T], undefined>;
}
