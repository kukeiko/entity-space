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

    export type Computed<X>
        = X extends Property.Id.Computed<infer K, infer V, infer T, infer I>
        ? {
            type: Property.Id.Computed.TypeId;
            computedFrom: Component.Computed<T, I, V>["computedFrom"];
            compute: Component.Computed<T, I, V>["compute"];
        }
        : {};
}
