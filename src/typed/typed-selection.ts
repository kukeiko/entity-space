import { Primitive, MergeUnion } from "../utils";
import { Property, Context } from "../property";

type SelectedValue<P extends Property, CTX extends Context> = P["value"] extends Primitive
    ? true
    : any[] extends P["value"]
    ? UnionSelection<Property.UnboxedValue<P>, CTX> | true
    : TypedSelection<Property.UnboxedValue<P>, CTX> | true;

/**
 * language workaround needed in case T is a union, e.g. Square | Circle.
 *
 * [todo] copied from stackoverflow, but forgot to add the link. finding it again shouldn't be too hard :) (keyword: "distributed unions" as far as i remember)
 */
type UnionSelection<T, CTX extends Context> = T extends any ? TypedSelection<T, CTX> : never;

export type TypedSelection<T, CTX extends Context = "loadable"> = {
    [K in Property.Keys<MergeUnion<T>, Context.Has<CTX>>]?: SelectedValue<MergeUnion<T>[K], CTX>;
};
