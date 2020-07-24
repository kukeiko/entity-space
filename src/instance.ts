import { Primitive, Unbox } from "./utils";
import { Property, Attribute, Context } from "./property";

type BoxPropertyValue<P, V> = P extends Attribute.IsIterable ? V[] : V;

type UnionInstance<U, CTX extends Context = "loadable", IS = Property, ISNOT = never, EXP = {}> = U extends any ? Instance<U, CTX, IS, ISNOT, EXP> : never;

type InstancedValueOfProperty<P, CTX extends Context, IS, ISNOT, EXP = {}> = P extends Property
    ? P["value"] extends Primitive
        ? BoxPropertyValue<P, ReturnType<P["value"]>>
        : P["value"] extends string // strictly typed strings (as in type = '"foo"' instead of 'string')
        ? P["value"]
        : P["value"] extends number // strictly typed numbers (as in type = '7' instead of 'number')
        ? P["value"]
        : any[] extends P["value"] // unions of other entities
        ? BoxPropertyValue<P, UnionInstance<Unbox<Unbox<P["value"]>>, CTX, IS, ISNOT, EXP>>
        : BoxPropertyValue<P, Instance<Unbox<P["value"]>, CTX, IS, ISNOT, EXP>> // entity
    : never;

// type WidenedInstancedValueOfProperty<P, CTX extends Context, EXP = {}> = Context.WidenValue<P, CTX, InstancedValueOfProperty<P, CTX, Property, never, EXP>>;

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

export type Instance<T, CTX extends Context = "loadable", IS = Property, ISNOT = never, EXP = {}> = T extends any ? InstanceCore<T, CTX, IS, ISNOT, EXP> : never;
//  InstancedRequiredProperties<T, CTX, IS, ISNOT, EXP> &
//     InstancedOptionalProperties<T, CTX, IS, ISNOT, EXP> &
    // InstancedExpandedProperties<T, CTX, IS, ISNOT, EXP>;

type UnpackUnionInstance<T, CTX extends Context, IS, ISNOT, S> = T extends any ? Instance<T, CTX, IS, ISNOT, S> : never;

export module Instance {
    // export type Selected<T, S, CTX extends Context = "loadable", IS = Property, ISNOT = never> = Instance<T, CTX, IS, ISNOT, S>;
    export type Selected<T, S, CTX extends Context = "loadable", IS = Property, ISNOT = never> = UnpackUnionInstance<T, CTX, IS, ISNOT, S>;
}
