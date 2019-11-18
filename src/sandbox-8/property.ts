import { Primitive, Unbox } from "./lang";
import { Type } from "./type";
import { Selection } from "./selection";

export interface Property<K extends string = string, V = any, P = V extends Primitive ? true : false> {
    key: K;
    value: V;
    primitive: P;
}

export module Property {
    export function is(x?: any): x is Property {
        x = x || {};

        return typeof ((x as Property).key) === "string" && (x as Property).value != null;
    }
}

export type PartialProperty<P extends Property>
    = P["value"] extends Primitive ? P | undefined
    : ReplacePropertyValue<P, PartialType<Unbox<P["value"]>>> | undefined;

/**
 * A type where any of its properties and those of expandable types can be undefined.
 */
export type PartialType<T extends Type> = Selection<T> & {
    [K in PropertyKeys<T>]: PartialProperty<T[K]>;
};

/**
 * The keys in T that point to a Property optionally extending P and are possibly undefined.
 */
export type OptionalPropertyKeys<T, P = Property> = Exclude<({
    [K in keyof T]: undefined extends T[K] ? (T[K] extends (Property & P) | undefined ? K : never) : never;
})[keyof T], undefined>;

/**
 * The keys in T that point to a Property optionally extending P and are defined.
 */
export type RequiredPropertyKeys<T, P = Property> = Exclude<({
    [K in keyof T]: T[K] extends (Property & P) ? K : never;
})[keyof T], undefined>;

/**
 * The keys in T that point to a Property optionally extending P and are either undefined or defined.
 */
export type PropertyKeys<T, P = Property>
    = OptionalPropertyKeys<T, P>
    | RequiredPropertyKeys<T, P>;

export type PickedOptionalProperty<P extends Property | undefined, X = Property>
    = Exclude<P, undefined>["value"] extends Primitive ? P | undefined
    : ReplacePropertyValue<Exclude<P, undefined>, PickProperties<Unbox<Exclude<P, undefined>["value"]>, X>> | undefined;

export type PickedRequiredProperty<P extends Property, X = Property>
    = P["value"] extends Primitive ? P
    : ReplacePropertyValue<P, PickProperties<Unbox<P["value"]>, X>>;

export type PickOptionalProperties<B extends Type, P = Property> = {
    // [K in OptionalPropertyKeys<T, P>]?: T[K];
    // [K in OptionalPropertyKeys<T, P>]: PickedOptionalPropertyValue<T[K], P>;
    [K in OptionalPropertyKeys<B, P>]: PickedOptionalProperty<B[K], P>;
};

export type PickRequiredProperties<B extends Type, X = Property> = Selection<B> & {
    [K in RequiredPropertyKeys<B, X>]: PickedRequiredProperty<B[K], X>
};

export type PickProperties<B extends Type, P = Property>
    = PickOptionalProperties<B, P>
    & PickRequiredProperties<B, P>;

/**
 * Takes a property P and exchanges its value with what is provided for V.
 */
export type ReplacePropertyValue<P extends Property, V> = Omit<P, "value"> & { value: V };

/**
 * A record containing property P (P["key"] => P) with its value replaced with what is provided for V.
 */
export type WithReplacedValueProperty<P extends Property, V> = Record<P["key"], ReplacePropertyValue<P, V>>;

export type DefaultValueOfProperty<P extends Property>
    = P["value"] extends Primitive ? P["value"]
    : {};

export function propertiesOf<T extends Type | Selection>(type: T): Record<string, Property> {
    let fields: Record<string, Property> = {};

    for (let k in type) {
        let candidate = type[k];

        if (Property.is(candidate)) {
            fields[k] = candidate;
        }
    }

    return fields;
}
