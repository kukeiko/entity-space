import { Component } from "../component";
import { Type } from "../type";
import { Instance } from "../instance";

export type Complex<
    K extends string,
    T extends Type<string>,
    M extends "n" | "p" | "c" = never,
    A extends string = K>
    = Component.Complex
    & Component.Dto<A, Partial<Instance.Dto<T>>, M>
    & Component.Navigable<T>
    & Component.Property<K, Partial<Instance<T>>, M>;

export module Complex {
    export type Computed
        = {};

    export type Ethereal<
        K extends string,
        T extends Type<string>,
        M extends "n" = never>
        = Component.Complex
        & Component.Ethereal
        & Component.Navigable<T>
        & Component.Property<K, Partial<Instance<T>>, M>;

    export type Array<
        K extends string,
        T extends Type<string>,
        M extends "n" | "p" | "c" = never,
        A extends string = K>
        = Component.Array
        & Component.Dto<A, Instance.Dto<Partial<T>[]>, M>
        & Component.Complex
        & Component.Navigable<T>
        & Component.Property<K, Instance<Partial<T>[]>, M>;

    export module Array {
        export type Computed = {};
        export type Ethereal = {};
    }
}
