import { Local } from "./local";

export type Simple<V extends number | number[] | string | string[], K extends string, A extends string = K, D = V> = {
    fromDto: (dtoValue: D) => V;
    toDto: (value: V) => D;
} & Local<V, K, A, D>;

export module Simple {
    export type Keys<T> = keyof T & Exclude<{ [P in keyof T]: T[P] extends Simple<infer _1, infer K, infer _3, infer _4> | undefined ? K : never }[keyof T], undefined>;
}
