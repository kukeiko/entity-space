import { Class } from "./lang";

export const TypeMetadataSymbol: unique symbol = Symbol();

export interface StaticType<T extends Class = Class> {
    [TypeMetadataSymbol]: StaticType.Metadata<T>;
}

export module StaticType {
    export function is(x?: any): x is StaticType {
        return ((x || {}) as any as StaticType)[TypeMetadataSymbol]?.static === true;
    }

    export interface Metadata<T extends Class = Class> {
        static: true;
        class: T;
    }

    export module Metadata {
        export function create<T extends Class = Class>(type: T): Metadata<T> {
            return {
                class: type,
                static: true
            };
        }
    }
}

export interface DynamicType<T extends StaticType = StaticType> {
    [TypeMetadataSymbol]: DynamicType.Metadata<T>;
}

export module DynamicType {
    export function is(x?: any): x is DynamicType {
        return ((x || {}) as any as DynamicType)[TypeMetadataSymbol]?.static === false;
    }
    
    export interface Metadata<T extends StaticType = StaticType> {
        static: false;
        source: T;
    }

    export module Metadata {
        export function create<T extends StaticType = StaticType>(source: T): Metadata<T> {
            return {
                static: false,
                source
            };
        }
    }
}

export type Type = DynamicType | StaticType;
