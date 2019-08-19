import { Property } from "../../property";
import { ModifiersDefinition } from "./modifiers.definition";

export type PrimitiveDefinition<X>
    = PrimitiveDefinition.Common<X>
    & PrimitiveDefinition.DtoKey<X>
    & PrimitiveDefinition.DtoConverters<X>
    & ModifiersDefinition<X>;

export module PrimitiveDefinition {
    export type Common<X>
        = X extends Property.Primitive<infer K, infer V, infer M, infer A, infer D>
        ? {
            type: Property.Primitive.TypeId;
            primitive: Property.Primitive<K, V, M, A, D>["primitive"];
        }
        : {};

    export type DtoKey<X>
        = X extends Property.Primitive<infer K, infer V, infer M, infer A, infer D>
        ? A extends K ? {} : {
            dtoKey: A;
        } : {};

    export type DtoConverters<X>
        = X extends Property.Primitive<infer K, infer V, infer M, infer A, infer D>
        ? D extends V
        ? {}
        : {
            fromDto: Property.Primitive<K, V, M, A, D>["fromDto"];
            toDto: Property.Primitive<K, V, M, A, D>["toDto"];
        }
        : {};

    export type Computed<X>
        = X extends Property.Primitive.Computed<infer K, infer V, infer T, infer I, infer M>
        ? {
            type: Property.Primitive.Computed.TypeId;
            computedFrom: Property.Primitive.Computed<K, V, T, I, M>["computedFrom"];
            compute: Property.Primitive.Computed<K, V, T, I, M>["compute"];
        }
        : {};

    export type Ethereal<X>
        = X extends Property.Primitive.Ethereal<infer K, infer V, infer M>
        ? {
            type: Property.Primitive.Ethereal.TypeId;
        }
        : {};

    export type Array<X>
        = Array.TypeId<X>
        & Array.DtoKey<X>
        & Array.DtoConverters<X>
        & ModifiersDefinition<X>;

    export module Array {
        export type TypeId<X>
            = X extends Property.Primitive.Array<infer K, infer V, infer M, infer A, infer D>
            ? {
                type: Property.Primitive.Array.TypeId;
            }
            : {};

        export type DtoKey<X>
            = X extends Property.Primitive.Array<infer K, infer V, infer M, infer A, infer D>
            ? A extends K ? {} : {
                dtoKey: A;
            } : {};

        export type DtoConverters<X>
            = X extends Property.Primitive.Array<infer K, infer V, infer M, infer A, infer D>
            ? D extends V
            ? {}
            : {
                fromDto: Property.Primitive.Array<K, V, M, A, D>["fromDto"];
                toDto: Property.Primitive.Array<K, V, M, A, D>["toDto"];
            }
            : {};

        export type Deserialized<X>
            = Deserialized.TypeId<X>
            & Deserialized.DtoKey<X>
            & Deserialized.DtoConverters<X>
            & ModifiersDefinition<X>;

        export module Deserialized {
            export type TypeId<X>
                = X extends Property.Primitive.Array.Deserialized<infer K, infer V, infer M, infer A, infer D>
                ? {
                    type: Property.Primitive.Array.Deserialized.TypeId;
                }
                : {};

            export type DtoKey<X>
                = X extends Property.Primitive.Array.Deserialized<infer K, infer V, infer M, infer A, infer D>
                ? A extends K ? {} : {
                    dtoKey: A;
                } : {};

            export type DtoConverters<X>
                = X extends Property.Primitive.Array.Deserialized<infer K, infer V, infer M, infer A, infer D>
                ? {
                    fromDto: Property.Primitive.Array.Deserialized<K, V, M, A, D>["fromDto"];
                    toDto: Property.Primitive.Array.Deserialized<K, V, M, A, D>["toDto"];
                }
                : {};
        }
    }
}
