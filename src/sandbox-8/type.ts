import { Class } from "./lang";

export const TypeSymbol: unique symbol = Symbol();

/**
 * [todo] could also name it "SourceType", and rename "DynamicType" to "PickedType", would be consistent with naming of "PickProperties"
 * *or* "Schema" and "Selection"
 * *or* "Blueprint" and "Selection" (so they start with different letters for nicer generic types)
 * but "S" from "Selection" conflicts with "S" from "State", so maybe change that as well.
 */
export interface Type<T extends Class = Class> {
    [TypeSymbol]: Type.Metadata<T>;
}

export module Type {
    export function is(x?: any): x is Type {
        return ((x || {}) as any as Type)[TypeSymbol]?.class instanceof Function;
    }

    export interface Metadata<T extends Class = Class> {
        class: T;
    }

    export module Metadata {
        export function create<T extends Class = Class>(type: T): Metadata<T> {
            return {
                class: type
            };
        }
    }
}
