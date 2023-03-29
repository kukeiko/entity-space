import { Class, Primitive, Unbox } from "@entity-space/utils";
import {
    ArrayAttribute,
    BlueprintProperty,
    Discriminant,
    NullableAttribute,
    RequiredAttribute,
} from "./entity-blueprint-property";

// [todo] what is this? is it used?
export interface Metadata<T = any> {
    // in open-api context, its the uri. in indexeddb, its going to be the object store name.
    // we may want to split it up at some point - let's see.
    name: string;
    properties: Record<keyof T, BlueprintProperty>;
    key: string[];
    indexes?: string[];
}

export interface MetadataReference<T = any> {
    $ref: string;
}

type InstancePropertyValueType<V> = V extends Primitive
    ? ReturnType<V>
    : V extends Discriminant
    ? V
    : V extends Class
    ? EntityBlueprintInstance<InstanceType<V>>
    : V extends Metadata<infer U>
    ? U
    : V extends MetadataReference<infer U>
    ? U
    : never;

type BoxIfArray<P, V> = P extends ArrayAttribute ? V[] : V;
type NullIfNullable<P, V> = P extends NullableAttribute ? V | null : V;

type RequiredPropertyKeys<T> = Exclude<
    { [K in keyof T]: T[K] extends RequiredAttribute ? K : never }[keyof T],
    undefined
>;

// [todo] for both InstanceDefault & InstanceRequired, consider extracting "NullIfNullable<..., BoxIfArray<...,"
// into a single "WidenValueBasedOnAttributes" (better name to be found) type. make sure to write type tests.
type InstanceDefault<T> = {
    // [todo] document that this *has* to be "keyof T", otherwise intellisense for expansion won't work.
    // in absolute worst case scenario we could still do something like the TypedSelector - but it just is much
    // more convenient to simply supply a plain old javascript object for a function that wants an expansion.
    //
    // an incredible relief is that we can still use mapped keyof stuff like in "InstanceRequired<T>";
    // looks like TypeScript can provide intellisense if at least one of the types has "keyof T"
    [K in keyof T]?: T[K] extends BlueprintProperty<infer V>
        ? NullIfNullable<T[K], BoxIfArray<T[K], InstancePropertyValueType<Unbox<V>>>>
        : T[K];
};

type InstanceRequired<T> = {
    [K in RequiredPropertyKeys<T>]: T[K] extends BlueprintProperty<infer V>
        ? NullIfNullable<T[K], BoxIfArray<T[K], InstancePropertyValueType<Unbox<V>>>>
        : T[K];
};

export type EntityBlueprintInstance<T> = InstanceDefault<T> & InstanceRequired<T>;
