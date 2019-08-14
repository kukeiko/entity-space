import { Component } from "../../component";
import { Property } from "../../property";

export type IdDefinition<X>
    = IdDefinition.DtoKey<X>
    & IdDefinition.DtoConverters<X>;

export module IdDefinition {
    export type DtoKey<X>
        = X extends Property.Id<infer K, infer V, infer A, infer D>
        ? A extends K ? {} : {
            dtoKey: A extends K ? undefined : A;
        } : {};

    export type DtoConverters<X>
        = X extends Property.Id<infer K, infer V, infer A, infer D>
        ? D extends V
        ? {}
        : {
            fromDto(v: ReturnType<D>): ReturnType<V>;
            toDto(v: ReturnType<V>): ReturnType<D>;
        }
        : {};
}
