import { Primitive, Class } from "../../utils";
import { Property, Attribute, Context } from "../property";

type BoxPropertyValue<P, V> = P extends Attribute.IsIterable ? V[] : V;

type UnionInstance<U, CTX extends Context = "loadable", IS = Property, ISNOT = never, EXP = {}> = U extends any ? TypedInstance<U, CTX, IS, ISNOT, EXP> : never;

type InstancedValueOfProperty<P, CTX extends Context, IS, ISNOT, EXP = {}> = P extends Property
    ? P["value"][number] extends Primitive
        ? BoxPropertyValue<P, ReturnType<P["value"][number]>>
        : P["value"][number] extends string // strictly typed strings (as in type = '"foo"' instead of 'string')
        ? P["value"][number]
        : P["value"][number] extends number // strictly typed numbers (as in type = '7' instead of 'number')
        ? P["value"][number]
        : P["value"][number] extends Class // unions of other entities
        ? BoxPropertyValue<P, UnionInstance<InstanceType<P["value"][number]>, CTX, IS, ISNOT, EXP>>
        : never
    : never;

type ExpandedKeys<EXP> = Exclude<
    {
        [K in keyof EXP]: undefined extends EXP[K] ? never : K;
    }[keyof EXP],
    undefined
>;

type InstancedRequiredProperties<T, CTX extends Context, IS, ISNOT, EXP> = {
    [K in Exclude<Property.Keys<T, Context.IsRequired<CTX> & IS, ISNOT>, ExpandedKeys<EXP>>]: Context.WidenValue<T[K], CTX, InstancedValueOfProperty<T[K], CTX, IS, ISNOT>>;
};

type InstancedOptionalProperties<T, CTX extends Context, IS, ISNOT, EXP> = {
    [K in Exclude<Property.Keys<T, Context.IsOptional<CTX> & IS, ISNOT>, ExpandedKeys<EXP>>]?: Context.WidenValue<T[K], CTX, InstancedValueOfProperty<T[K], CTX, IS, ISNOT>>;
};

type InstancedExpandedProperties<T, CTX extends Context, IS, ISNOT, EXP> = {
    [K in Property.Keys<T, Context.IsOptional<CTX> & IS, ISNOT> & ExpandedKeys<EXP>]: Exclude<
        Context.WidenValue<T[K], CTX, InstancedValueOfProperty<T[K], CTX, IS, ISNOT, EXP[K]>>,
        undefined
    >;
};

type InstanceCore<T, CTX extends Context = "loadable", IS = Property, ISNOT = never, EXP = {}> = InstancedRequiredProperties<T, CTX, IS, ISNOT, EXP> &
    InstancedOptionalProperties<T, CTX, IS, ISNOT, EXP> &
    InstancedExpandedProperties<T, CTX, IS, ISNOT, EXP>;

export type TypedInstance<T, CTX extends Context = "loadable", IS = Property, ISNOT = never, EXP = {}> = T extends any ? InstanceCore<T, CTX, IS, ISNOT, EXP> : never;

type UnpackUnionInstance<T, CTX extends Context, IS, ISNOT, S> = T extends any ? TypedInstance<T, CTX, IS, ISNOT, S> : never;

export module TypedInstance {
    // export type Selected<T, S, CTX extends Context = "loadable", IS = Property, ISNOT = never> = Instance<T, CTX, IS, ISNOT, S>;
    export type Selected<T, S, CTX extends Context = "loadable", IS = Property, ISNOT = never> = UnpackUnionInstance<T, CTX, IS, ISNOT, S>;
}
