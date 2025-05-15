import { Class, Primitive, Unbox } from "@entity-space/utils";
import {
    ArrayAttribute,
    BlueprintProperty,
    NullableAttribute,
    OptionalAttribute,
} from "./entity-blueprint-property.mjs";

type PropertyValueType<V> = V extends Primitive
    ? ReturnType<V>
    : V extends Class
      ? EntityBlueprintInstance<InstanceType<V>>
      : never;

type BoxIfContainer<P, V> = P extends ArrayAttribute ? V[] : V;
type NullIfNullable<P, V> = P extends NullableAttribute ? V | null : V;

type RequiredPropertyKeys<T> = Exclude<
    { [K in keyof T]: T[K] extends OptionalAttribute ? never : K }[keyof T],
    undefined
>;

type InstanceDefault<T> = {
    [K in keyof T]?: T[K] extends BlueprintProperty<infer V>
        ? NullIfNullable<T[K], BoxIfContainer<T[K], PropertyValueType<Unbox<V>>>>
        : T[K];
};

type InstanceRequired<T> = {
    [K in RequiredPropertyKeys<T>]: T[K] extends BlueprintProperty<infer V>
        ? NullIfNullable<T[K], BoxIfContainer<T[K], PropertyValueType<Unbox<V>>>>
        : T[K];
};

export type EntityBlueprintInstance<T> = InstanceDefault<T> & InstanceRequired<T>;
