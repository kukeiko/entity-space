import { Property } from "../../property";
import { Component } from "../../component";
import { FlagsDefinition } from "./modifiers.definition";

export type ComplexDefinition<X>
    = X extends Property.Complex<infer K, infer T, infer F, infer A>
    ? (
        {
            type: Property.Complex.TypeId;
            otherTypeKey: T["$"]["key"];
        }
        & (A extends K ? {} : { dtoKey: A; })
        & FlagsDefinition<F>
    )
    : {};

export module ComplexDefinition {
    export interface AllArgs {
        type: Property.Complex.TypeId;
        otherTypeKey: string;
        dtoKey?: string;
        flags?: Record<Component.Modifier, true>;
    }

    export type Ethereal<X>
        = X extends Property.Complex.Ethereal<infer K, infer T, infer F>
        ? (
            {
                type: Property.Complex.Ethereal.TypeId;
                otherTypeKey: T["$"]["key"];
            }
            & FlagsDefinition<F>
        ) : {};

    export module Ethereal {
        export interface AllArgs {
            type: Property.Complex.Ethereal.TypeId;
            otherTypeKey: string;
            flags?: Record<Component.Modifier, true>;
        }
    }

    export type Array<X>
        = X extends Property.Complex.Array<infer K, infer T, infer F, infer A>
        ? (
            {
                type: Property.Complex.Array.TypeId;
                otherTypeKey: T["$"]["key"];
            }
            & (A extends K ? {} : { dtoKey: A; })
            & FlagsDefinition<F>
        )
        : {};

    export module Array {
        export interface AllArgs {
            type: Property.Complex.Array.TypeId;
            otherTypeKey: string;
            dtoKey?: string;
            flags?: Record<Component.Modifier, true>;
        }
    }
}
