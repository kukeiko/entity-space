import { Primitive, MergeUnion } from "../utils";
import { Property, Context } from "../property";

type SelectedValue<P extends Property, CTX extends Context> = P["value"] extends Primitive
    ? true
    : any[] extends P["value"]
    ? UnionSelection<Property.UnboxedValue<P>, CTX> | true
    : Selection<Property.UnboxedValue<P>, CTX> | true;

/**
 * language workaround needed in case T is a union, e.g. Square | Circle.
 *
 * [todo] copied from stackoverflow, but forgot to add the link. finding it again shouldn't be too hard :) (keyword: "distributed unions" as far as i remember)
 */
type UnionSelection<T, CTX extends Context> = T extends any ? Selection<T, CTX> : never;

export type Selection<T, CTX extends Context = "loadable"> = {
    [K in Property.Keys<MergeUnion<T>, Context.Has<CTX, boolean, true>>]?: SelectedValue<MergeUnion<T>[K], CTX>;
};

export module Selection {
    export type Untyped = { [key: string]: true | Untyped };
}