import { Class, Primitive, Unbox } from "../utils/public";
import { ArrayAttribute, Discriminant, Property, RequiredAttribute, NullableAttribute } from "./property";

type InstancePropertyValueType<V> = V extends Primitive ? ReturnType<V> : V extends Discriminant ? V : V extends Class ? Instance<InstanceType<V>> : never;
type BoxIfArray<P, V> = P extends ArrayAttribute ? V[] : V;
type NullIfNullable<P, V> = P extends NullableAttribute ? V | null : V;

export type RequiredPropertyKeys<T> = Exclude<{ [K in keyof T]: T[K] extends RequiredAttribute ? K : never }[keyof T], undefined>;

type InstanceDefault<T> = {
    // [todo] document that this *has* to be "keyof T", otherwise intellisense for expansion won't work.
    // in absolute worst case scenario we could still do something like the TypedSelector - but it just is much
    // more convenient to simply supply a plain old javascript object for a function that wants an expansion.
    // an incredibly relief is that we can still use mapped keyof stuff like in "InstanceRequired<T>";
    // looks like TypeScript can provide intellisense if at least one of the types has "keyof T"
    [K in keyof T]?: T[K] extends Property<infer V> ? NullIfNullable<T[K], BoxIfArray<T[K], InstancePropertyValueType<Unbox<V>>>> : T[K];
};

type InstanceRequired<T> = {
    [K in RequiredPropertyKeys<T>]: T[K] extends Property<infer V> ? NullIfNullable<T[K], BoxIfArray<T[K], InstancePropertyValueType<Unbox<V>>>> : T[K];
};

export type Instance<T> = InstanceDefault<T> & InstanceRequired<T>;
