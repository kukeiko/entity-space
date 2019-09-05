import { Component } from "../../component";
import { Property } from "../../property";

export type IdDefinition<X>
    = IdDefinition.TypeId<X>
    & IdDefinition.DtoKey<X>
    & IdDefinition.DtoConverters<X>;

export module IdDefinition {
    export type TypeId<X>
        = X extends Property.Id<infer K, infer V, infer A, infer D>
        ? {
            type: Property.Id.TypeId;
            primitive: Property.Primitive<K, V, "u", A, D>["primitive"];
        }
        : {};

    export type DtoKey<X>
        = X extends Property.Id<infer K, infer V, infer A, infer D>
        ? A extends K ? {} : {
            dtoKey: A;
        } : {};

    export type DtoConverters<X>
        = X extends Property.Id<infer K, infer V, infer A, infer D>
        ? D extends V
        ? {}
        : {
            fromDto: Property.Id<K, V, A, D>["fromDto"];
            toDto: Property.Id<K, V, A, D>["toDto"];
        }
        : {};

    export interface AllArgs {
        type: Property.Id.TypeId;
        dtoKey?: string;
        primitive: Component.Primitive.ValueType;
        fromDto?: (dto: unknown) => unknown;
        toDto?: (dto: unknown) => unknown;
    }

    export type Computed<X>
        = X extends Property.Id.Computed<infer K, infer V, infer T, infer I>
        ? {
            type: Property.Id.Computed.TypeId;
            computedFrom: Property.Id.Computed<K, V, T, I>["computedFrom"];
            compute: Property.Id.Computed<K, V, T, I>["compute"];
        }
        : {};
}
