import { Unbox, NullIfNull } from "../lang";
import { Local } from "./local";

type ValueConstructor = ((...args: any[]) => any);
type UnpackableConstructor = null | ValueConstructor | ValueConstructor[] | (ValueConstructor | null)[];
type FetchConstructor<T extends UnpackableConstructor> = Exclude<Unbox<Exclude<T, null>>, null>;

type PackedValueType<C, T extends UnpackableConstructor, U = Exclude<T, null>>
    = U extends (infer R)[] ? null extends R ? NullIfNull<(C | null)[], T> : NullIfNull<C[], T>
    : NullIfNull<C, T>;

export type Simple<
    T extends UnpackableConstructor,
    K extends string,
    A extends string = K,
    DT = ReturnType<FetchConstructor<T>>,
    VT = ReturnType<FetchConstructor<T>>,
    D = PackedValueType<DT, T>,
    V = PackedValueType<VT, T>
    > = {
        fromDto: (dtoValue: D) => V;
        toDto: (value: V) => D;
        valueConstructor: FetchConstructor<T>;
    } & Local<V, K, A, D>;

export module Simple {
    export type Keys<T> = keyof T & Exclude<{ [P in keyof T]: T[P] extends Simple<infer _1, infer K, infer _3, infer _4> | undefined ? K : never }[keyof T], undefined>;

    // [note] i imagine this to be used for the system-id use case; "Ethereal" as name chosen because i love it,
    // and there is a somewhat technically plausible reason for it (as per definition from wiktionary.com):
    // "Pertaining to the hypothetical upper, purer air, or to the higher regions beyond the earth or beyond the atmosphere; celestial; otherworldly."
    // => system A is otherworldly to system B and vice versa, they are out of each others' reach.
    // since it therefore can't be inferred from a dto, it has to be supplied to the mapper that maps dtos to instances
    export module Ethereal {

    }
}
