import { Primitive } from "./lang";
import { Property, PartialPropertyKeysOf, RequiredPropertyKeysOf } from "./property";
import { Flagged } from "./flag";

export type BoxPropertyValue<P, V>
    = P extends Flagged<"nullable"> ? P extends Flagged<"iterable"> ? V[] | null : V | null
    : P extends Flagged<"iterable"> ? V[] : V;

export type InstancedValueOfProperty<P extends Property | undefined, V = Exclude<P, undefined>["value"]>
    = undefined extends P
    ? (V extends Primitive ? BoxPropertyValue<P, ReturnType<V>> : BoxPropertyValue<P, TypeInstance<V>>) | undefined
    : V extends Primitive ? BoxPropertyValue<P, ReturnType<V>> : BoxPropertyValue<P, TypeInstance<V>>;

export type PartialTypeInstance<T, P = Property> = {
    [K in PartialPropertyKeysOf<T, P>]?: InstancedValueOfProperty<T[K]>;
};

export type RequiredTypeInstance<T, P = Property> = {
    [K in RequiredPropertyKeysOf<T, P>]: InstancedValueOfProperty<T[K]>;
};

export type TypeInstance<T> = PartialTypeInstance<T> & RequiredTypeInstance<T>;
