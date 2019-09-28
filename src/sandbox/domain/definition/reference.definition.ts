import { Property } from "../../property";
import { Component } from "../../component";
import { FlagsDefinition } from "./modifiers.definition";

export type ReferenceDefinition<X>
    = X extends Property.Reference<infer K, infer T, infer P, infer F, infer A>
    ? (
        {
            type: Property.Reference.TypeId;
            otherTypeKey: T["$"]["key"];
            localKey: P["key"];
        }
        & (A extends K ? {} : { dtoKey: A; })
        & FlagsDefinition<F>
    )
    : {};

export module ReferenceDefinition {
    export interface AllArgs {
        type: Property.Reference.TypeId;
        otherTypeKey: string;
        localKey: string;
        dtoKey?: string;
        flags?: Record<Component.Modifier, true>;
    }

    export type Id<X>
        = X extends Property.Reference.Id<infer K, infer T, infer P, infer F, infer A>
        ? (
            {
                type: Property.Reference.Id.TypeId;
                primitive: Property.Reference.Id<K, T, P, F, A>["primitive"];
                otherTypeKey: T["$"]["key"];
                otherIdKey: P;
            }
            & (A extends K ? {} : { dtoKey: A; })
            & (Component.Dto.ValueOf<T[P]> extends Component.Property.ValueOf<T[P]> ? {} : {
                fromDto: Property.Reference.Id<K, T, P, F, A>["fromDto"];
                toDto: Property.Reference.Id<K, T, P, F, A>["toDto"];
            })
            & FlagsDefinition<F>
        )
        : {};

    export module Id {
        export interface AllArgs {
            dtoKey?: string;
            type: Property.Reference.Id.TypeId;
            fromDto?: (dto: any) => any;
            toDto?: (dto: any) => any;
            flags?: Record<Component.Modifier, true>;
            otherIdKey: string;
            otherTypeKey: string;
            primitive: Component.Primitive.ValueType;
        }
    }
}
