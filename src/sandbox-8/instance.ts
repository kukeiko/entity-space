import { Primitive } from "./lang";
import { Property, PartialPropertyKeysOf, RequiredPropertyKeysOf } from "./property";
import { Nullable, Iterable } from "./components";

export type BoxPropertyValue<T, V>
    = T extends Nullable ? T extends Iterable ? V[] | null : V | null
    : T extends Iterable ? V[] : V;

export type InstancedValueOfProperty<P extends Property | undefined, V = Exclude<P, undefined>["value"]>
    = undefined extends P
    ? (V extends Primitive ? BoxPropertyValue<P, ReturnType<V>> : BoxPropertyValue<P, InstanceOf<V>>) | undefined
    : V extends Primitive ? BoxPropertyValue<P, ReturnType<V>> : BoxPropertyValue<P, InstanceOf<V>>;

export type PartialInstanceOf<T, P = Property> = {
    [K in PartialPropertyKeysOf<T, P>]?: InstancedValueOfProperty<T[K]>;
};

export type RequiredInstanceOf<T, P = Property> = {
    [K in RequiredPropertyKeysOf<T, P>]: InstancedValueOfProperty<T[K]>;
};

export type InstanceOf<T> = PartialInstanceOf<T> & RequiredInstanceOf<T>;
