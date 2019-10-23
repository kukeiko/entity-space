import { Class } from "./lang";

export const TypeMetadataSymbol: unique symbol = Symbol();

export interface StaticType {
    [TypeMetadataSymbol]: StaticType.Metadata;
}

export module StaticType {
    export function is(x?: any): x is StaticType {
        return ((x || {}) as any as StaticType)[TypeMetadataSymbol]?.static === true;
    }

    export interface Metadata {
        static: true;
        class: Class;
    }

    export module Metadata {
        export function create(type: Class): Metadata {
            return {
                class: type,
                static: true
            };
        }
    }
}

export interface DynamicType {
    [TypeMetadataSymbol]: DynamicType.Metadata;
}

export module DynamicType {
    export function is(x?: any): x is DynamicType {
        return ((x || {}) as any as DynamicType)[TypeMetadataSymbol]?.static === false;
    }
    
    export interface Metadata {
        static: false;
        source: Type;
    }

    export module Metadata {
        export function create(source: Type): Metadata {
            return {
                static: false,
                source
            };
        }
    }
}

export type Type = DynamicType | StaticType;
