import { Primitive, Unbox } from "./lang";
import { Property, OptionalPropertyKeys, RequiredPropertyKeys } from "./property";
import { WithAttribute } from "./attribute";
import { Context, WithContext, WidenValueForContext } from "./context";

export type BoxPropertyValue<P, V> = P extends WithAttribute<"iterable"> ? V[] : V;

export type InstancedValueOfProperty<P extends Property | undefined, C extends Context, V = Exclude<P, undefined>["value"]>
    = undefined extends P
    ? (V extends Primitive ? BoxPropertyValue<Exclude<P, undefined>, ReturnType<V>> : BoxPropertyValue<Exclude<P, undefined>, Instance<Unbox<V>, C>>) | undefined
    : V extends Primitive ? BoxPropertyValue<P, ReturnType<V>> : BoxPropertyValue<P, Instance<Unbox<V>, C>>;

export type OptionalInstance<T, C extends Context> = {
    [K in OptionalPropertyKeys<T, WithContext<C, any, any, any>>]?: WidenValueForContext<T[K], C, InstancedValueOfProperty<T[K], C>>;
};

export type RequiredInstance<T, C extends Context> = {
    [K in RequiredPropertyKeys<T, WithContext<C, any, any, any>>]: WidenValueForContext<T[K], C, InstancedValueOfProperty<T[K], C>>;
};

export type Instance<T, S extends Context> = OptionalInstance<T, S> & RequiredInstance<T, S>;
