import { Component } from "../component";
import { Type } from "../type";

export type Primitive<
    K extends string,
    V extends Component.Primitive.ValueType,
    M extends Component.Modifier = never,
    A extends string = K,
    D extends Component.Primitive.ValueType = V>
    = {
        type: Primitive.TypeId;
        fromDto(v: ReturnType<D>): ReturnType<V>;
        toDto(v: ReturnType<V>): ReturnType<D>;
    }
    & Component.Dto<A, ReturnType<D>, M>
    & Component.NotArray
    & Component.Primitive<V>
    & Component.Property<K, ReturnType<V>, M>;

export module Primitive {
    export type TypeId = "primitive";
    export type Keys<T> = Exclude<{ [P in keyof T]: T[P] extends Primitive<any, any> | undefined ? P : never }[keyof T], undefined>;

    export type Computed<
        K extends string,
        V extends Component.Primitive.ValueType,
        T extends Type<string>,
        I extends Component.Local.Keys<T> & string,
        M extends "n" = never>
        = {
            type: Computed.TypeId;
        }
        & Component.Computed<T, I, V, M>
        & Component.Primitive<V>
        & Component.Property<K, ReturnType<V>, M>;

    export module Computed {
        export type TypeId = "primitive:computed";
    }

    export type Ethereal<
        K extends string,
        V extends Component.Primitive.ValueType,
        M extends "n" = never>
        = {
            type: Ethereal.TypeId;
        }
        & Component.Ethereal
        & Component.Primitive<V>
        & Component.Property<K, ReturnType<V>, M>;

    export module Ethereal {
        export type TypeId = "primitive:ethereal";
    }

    export type Array<
        K extends string,
        V extends Component.Primitive.ValueType,
        M extends Exclude<Component.Modifier, "u"> = never,
        A extends string = K,
        D extends Component.Primitive.ValueType = V>
        = {
            type: Array.TypeId;
            fromDto(v: ReturnType<D>[]): ReturnType<V>[];
            toDto(v: ReturnType<V>[]): ReturnType<D>[];
        }
        & Component.Array
        & Component.Dto<A, ReturnType<D>[], M>
        & Component.Primitive<V>
        & Component.Property<K, ReturnType<V>[]>;

    export module Array {
        export type TypeId = "primitive:array";

        export type Deserialized<
            K extends string,
            V extends Component.Primitive.ValueType,
            M extends Exclude<Component.Modifier, "u"> = never,
            A extends string = K,
            D extends Component.Primitive.ValueType = V>
            = {
                type: Deserialized.TypeId;
                fromDto(v: ReturnType<D>): ReturnType<V>[];
                toDto(v: ReturnType<V>[]): ReturnType<D>;
            }
            & Component.Array
            & Component.Dto<A, ReturnType<D>, M>
            & Component.Primitive<V>
            & Component.Property<K, ReturnType<V>[]>;

        export module Deserialized {
            export type TypeId = "primitive:array:deserialized";
        }

        export type Computed = {};
        export type Ethereal = {};
    }
}
