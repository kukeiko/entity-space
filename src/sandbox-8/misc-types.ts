import { Primitive, Unbox } from "./lang";
import { StaticType, DynamicType } from "./type";
import { Property, PropertyWithMappedValue, PropertyKeysOf } from "./property";
import { Flagged } from "./flag";

/**
 * [todo] if possible, somehow make this more generic by using Flagged<"loadable"> from flag.ts
 */
export type LoadableValueOfProperty<P extends Property>
    = P["value"] extends Primitive ? P["value"]
    : LoadableType<Unbox<P["value"]>>;

export type LoadableType<T extends StaticType> = DynamicType<T> & {
    [K in PropertyKeysOf<T, Flagged<"loadable">>]?: PropertyWithMappedValue<T[K], LoadableValueOfProperty<T[K]>>;
};
