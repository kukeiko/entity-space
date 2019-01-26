import { Local } from "./local";

export type Unique<V extends string | number, K extends string, A extends string = K, D = V> = {
    unique: true;
} & Local<V, K, A, D>;

export module Unique {
    export type Keys<T> = Exclude<{ [P in keyof T]: T[P] extends Unique<any, infer K, any> | undefined ? K : never }[keyof T], undefined>;
}
