import { Unbox, NullIfNull } from "../lang";
import { Local } from "./local";

type ValueConstructor = ((...args: any[]) => any);
type UnpackableConstructor = null | ValueConstructor | ValueConstructor[] | (ValueConstructor | null)[];;
type FetchConstructor<T extends UnpackableConstructor> = Exclude<Unbox<Exclude<T, null>>, null>;

type PackedValueType<C, T extends UnpackableConstructor, U = Exclude<T, null>>
    = U extends (infer R)[] ? null extends R ? NullIfNull<(C | null)[], T> : NullIfNull<C[], T>
    : NullIfNull<C, T>;

export type Simple<
    T extends UnpackableConstructor,
    K extends string,
    A extends string = K,
    DU = ReturnType<FetchConstructor<T>>,
    VU = ReturnType<FetchConstructor<T>>,
    D = PackedValueType<DU, T>,
    V = PackedValueType<VU, T>
    > = {
        fromDto: (dtoValue: D) => V;
        toDto: (value: V) => D;
        valueConstructor: FetchConstructor<T>;
    } & Local<V, K, A, D>;

export module Simple {
    export type Keys<T> = keyof T & Exclude<{ [P in keyof T]: T[P] extends Simple<infer _1, infer K, infer _3, infer _4> | undefined ? K : never }[keyof T], undefined>;
}
