import { Box, Unbox } from "../lang";
import { Instance } from "../instance";
import { Local } from "./local";
import { Navigable } from "./navigable";
import { Type } from "../type";

export type Struct<T, K extends string, A extends string = K, V = Box<Instance<Unbox<T>>, T>> =
    {
        struct: true;
    }
    & Local<V, K, A, Box<Instance.Dto<Unbox<T>>, T>>
    & Navigable<Unbox<T>, V, K, A>;

export module Struct {
    export type Keys<T> = keyof T & Exclude<{ [P in keyof T]: T[P] extends Struct<infer _1, infer K, infer _3, infer _4> | undefined ? K : never }[keyof T], undefined>;

    export function is(x: any): x is Struct<Type<string>, string, string> {
        return x != null && x.struct === true;
    }
}
