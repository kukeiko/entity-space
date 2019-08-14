import { Property } from "../../property";
import { ModifiersDefinition } from "./modifiers.definition";

export type PrimitiveDefinition<X>
    = PrimitiveDefinition.DtoKey<X>
    & PrimitiveDefinition.DtoConverters<X>
    & ModifiersDefinition<X>;

export module PrimitiveDefinition {
    export type DtoKey<X>
        = X extends Property.Primitive<infer K, infer V, infer M, infer A, infer D>
        ? A extends K ? {} : {
            dtoKey: A extends K ? undefined : A;
        } : {};

    export type DtoConverters<X>
        = X extends Property.Primitive<infer K, infer V, infer M, infer A, infer D>
        ? D extends V
        ? {}
        : {
            fromDto(v: ReturnType<D>): ReturnType<V>;
            toDto(v: ReturnType<V>): ReturnType<D>;
        }
        : {};

    // export type Modifiers<X>
    //     = X extends Property.Primitive<infer K, infer V, infer M, infer A, infer D>
    //     ? ModifiersDefinition<X> : {};


    export type Array<X>
        = Array.DtoKey<X>
        & Array.DtoConverters<X>
        & ModifiersDefinition<X>;

    export module Array {
        export type DtoKey<X>
            = X extends Property.Primitive.Array<infer K, infer V, infer M, infer A, infer D>
            ? A extends K ? {} : {
                dtoKey: A extends K ? undefined : A;
            } : {};

        export type DtoConverters<X>
            = X extends Property.Primitive.Array<infer K, infer V, infer M, infer A, infer D>
            ? D extends V
            ? {}
            : {
                fromDto(v: ReturnType<D>[]): ReturnType<V>[];
                toDto(v: ReturnType<V>[]): ReturnType<D>[];
            }
            : {};

        export type Serialized<X>
            = Serialized.DtoKey<X>
            & Serialized.DtoConverters<X>
            & ModifiersDefinition<X>;

        export module Serialized {
            export type DtoKey<X>
                = X extends Property.Primitive.Array.Serialized<infer K, infer V, infer M, infer A, infer D>
                ? A extends K ? {} : {
                    dtoKey: A extends K ? undefined : A;
                } : {};

            export type DtoConverters<X>
                = X extends Property.Primitive.Array.Serialized<infer K, infer V, infer M, infer A, infer D>
                ? {
                    fromDto(v: ReturnType<D>): ReturnType<V>[];
                    toDto(v: ReturnType<V>[]): ReturnType<D>;
                }
                : {};
        }
    }
}
