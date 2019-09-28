import { Property } from "../../property";
import { FlagsDefinition } from "./modifiers.definition";
import { Component } from "src/sandbox/component";

export type PrimitiveDefinition<X>
    = X extends Property.Primitive<infer K, infer V, infer F, infer A, infer D>
    ? (
        {
            type: Property.Primitive.TypeId;
            primitive: Property.Primitive<K, V, F, A, D>["primitive"];
        }
        & (A extends K ? {} : { dtoKey: A; })
        & (D extends V ? {} : {
            fromDto: Property.Primitive<K, V, F, A, D>["fromDto"];
            toDto: Property.Primitive<K, V, F, A, D>["toDto"];
        })
        & FlagsDefinition<F>
    ) : {};

export module PrimitiveDefinition {
    export interface AllArgs {
        type: Property.Primitive.TypeId;
        dtoKey?: string;
        primitive: Component.Primitive.ValueType;
        fromDto?: (dto: any) => any;
        toDto?: (dto: any) => any;
        flags?: Record<Component.Modifier, true>;
    }

    /**
     * [computed]
     */
    export type Computed<X>
        = X extends Property.Primitive.Computed<infer K, infer V, infer T, infer I, infer M>
        ? (
            {
                type: Property.Primitive.Computed.TypeId;
                computedFrom: Property.Primitive.Computed<K, V, T, I, M>["computedFrom"];
                compute: Property.Primitive.Computed<K, V, T, I, M>["compute"];
                primitive: V;
            }
            & FlagsDefinition<M>
        )
        : {};

    export module Computed {
        export interface AllArgs {
            type: Property.Primitive.Computed.TypeId;
            computedFrom: { [key: string]: true; };
            compute: (...args: any[]) => any;
            flags?: Record<Component.Modifier, true>;
            primitive: Component.Primitive.ValueType;
        }
    }

    /**
     * [ethereal]
     */
    export type Ethereal<X>
        = X extends Property.Primitive.Ethereal<infer K, infer V, infer F>
        ? (
            {
                type: Property.Primitive.Ethereal.TypeId;
                primitive: V;
            }
            & FlagsDefinition<F>
        )
        : {};

    export module Ethereal {
        export interface AllArgs {
            type: Property.Primitive.Ethereal.TypeId;
            primitive: Component.Primitive.ValueType;
            flags?: Record<Component.Modifier, true>;
        }
    }

    export type Array<X>
        = X extends Property.Primitive.Array<infer K, infer V, infer F, infer A, infer D>
        ? (
            {
                type: Property.Primitive.Array.TypeId;
                primitive: V;
            }
            & (A extends K ? {} : { dtoKey: A; })
            & (D extends V ? {} : {
                fromDto: Property.Primitive.Array<K, V, F, A, D>["fromDto"];
                toDto: Property.Primitive.Array<K, V, F, A, D>["toDto"];
            })
            & FlagsDefinition<F>
        ) : {};

    /**
     * [array]
     */
    export module Array {
        export interface AllArgs {
            type: Property.Primitive.Array.TypeId;
            primitive: Component.Primitive.ValueType;
            dtoKey?: string;
            fromDto?: (dto: any) => any;
            toDto?: (instance: any) => any;
            flags?: Record<Component.Modifier, true>;
        }

        export type Deserialized<X>
            = X extends Property.Primitive.Array.Deserialized<infer K, infer V, infer F, infer A, infer D>
            ? (
                {
                    type: Property.Primitive.Array.Deserialized.TypeId;
                    primitive: V;
                    fromDto: Property.Primitive.Array.Deserialized<K, V, F, A, D>["fromDto"];
                    toDto: Property.Primitive.Array.Deserialized<K, V, F, A, D>["toDto"];
                }
                & (A extends K ? {} : { dtoKey: A; })
                & FlagsDefinition<F>
            )
            : {};

        export module Deserialized {
            export interface AllArgs {
                type: Property.Primitive.Array.Deserialized.TypeId;
                primitive: Component.Primitive.ValueType;
                dtoKey?: string;
                fromDto: (dto: any) => any;
                toDto: (instance: any) => any;
                flags?: Record<Component.Modifier, true>;
            }
        }
    }
}
