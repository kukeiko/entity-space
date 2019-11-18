import { Type } from "./type";

export const SelectionSymbol: unique symbol = Symbol();

/**
 * [todo] i think T should be forced to be a StaticType, since "PickProperties" can't be used on DynamicTypes anyway.
 */
export interface Selection<T extends Type = Type> {
    [SelectionSymbol]: Selection.Metadata<T>;
}

export module Selection {
    export function is(x?: any): x is Selection {
        return Type.is(((x || {}) as any as Selection)[SelectionSymbol]?.type);
    }

    export interface Metadata<T extends Type = Type> {
        type: T;
    }

    export module Metadata {
        export function create<T extends Type = Type>(source: T): Metadata<T> {
            return {
                type: source
            };
        }
    }
}
