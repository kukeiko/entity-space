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
            }
            & (A extends K ? {} : { dtoKey: A; })
            & (Component.Dto.ValueOf<T[P]> extends Component.Primitive.ValueTypeOf<T[P]> ? {} : {
                /**
                 * [stopped-here]
                 * Reference.Id doesn't have fromDto & toDto, i guess i forgot to add it?
                 */
                // fromDto: Property.Reference.Id<K, T, P, F, A>["f"];
                // toDto: Property.Primitive<K, V, F, A, D>["toDto"];
            })
        )
        : {};
}
