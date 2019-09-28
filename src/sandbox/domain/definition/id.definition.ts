import { Component } from "../../component";
import { Property } from "../../property";

export type IdDefinition<X>
    = X extends Property.Id<infer K, infer V, infer A, infer D>
    ? (
        {
            type: Property.Id.TypeId;
            primitive: V;
        }
        & (A extends K ? {} : { dtoKey: A; })
        & (D extends V ? {} : {
            fromDto: Property.Id<K, V, A, D>["fromDto"];
            toDto: Property.Id<K, V, A, D>["toDto"];
        })
    )
    : {};

export module IdDefinition {
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
            primitive: V;
        }
        : {};

    export module Computed {
        export interface AllArgs {
            type: Property.Id.Computed.TypeId;
            computedFrom: { [key: string]: true; };
            compute: (...args: any[]) => any;
            primitive: Component.Primitive.ValueType;
        }
    }
}
