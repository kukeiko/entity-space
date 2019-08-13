import { Component } from "../component";
import { Type } from "../type";

export type Primitive<
    K extends string,
    V extends Component.Primitive.ValueType,
    M extends Component.Modifier = never,
    A extends string = K,
    D = ReturnType<V>>
    = {
        fromDto(v: D): ReturnType<V>;
        toDto(v: ReturnType<V>): D;
    }
    & Component.Dto<A, D, M>
    & Component.NotArray
    & Component.Local
    & Component.Primitive<V>
    & Component.Property<K, ReturnType<V>, M>;

export module Primitive {
    export type Keys<T> = Exclude<{ [P in keyof T]: T[P] extends Primitive<any, any> | undefined ? P : never }[keyof T], undefined>;

    export type Computed<
        K extends string,
        V extends Component.Primitive.ValueType,
        T extends Type<string>,
        I extends Component.Local.Keys<T> & string,
        M extends "n" = never>
        = Component.Computed<T, I, V, M>
        & Component.Local
        & Component.Primitive<V>
        & Component.Property<K, ReturnType<V>, M>;

    export type Ethereal<
        K extends string,
        V extends Component.Primitive.ValueType,
        M extends "n" = never>
        = Component.Ethereal
        & Component.Local
        & Component.Primitive<V>
        & Component.Property<K, ReturnType<V>, M>;

    export type Array<
        K extends string,
        V extends Component.Primitive.ValueType,
        M extends Component.Modifier = never,
        A extends string = K,
        D = ReturnType<V>>
        = {
            fromDto(v: D[]): ReturnType<V>[];
            toDto(v: ReturnType<V>[]): D[];
        }
        & Component.Array
        & Component.Dto<A, D[], M>
        & Component.Local
        & Component.Primitive<V>
        & Component.Property<K, ReturnType<V>[]>;

    export module Array {
        export type Computed = {};
        export type Ethereal = {};
    }
}
