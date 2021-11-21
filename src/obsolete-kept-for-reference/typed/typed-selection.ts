import { Primitive, MergeUnion } from "../../utils";
import { Property, Context } from "../property";

type SelectedValue<P extends Property, CTX extends Context> = P["value"][number] extends Primitive
    ? true // selection value of a property that contains primitives only can only be true
    : true | UnionSelection<Property.UnboxedValue<P>, CTX>; // otherwise it can either be true or an object with more nested selections

/**
 * language workaround needed in case T is a union, e.g. Square | Circle.
 *
 * https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html#distributive-conditional-types
 */
// type UnionSelection<T, CTX extends Context> = T extends any ? TypedSelection<T, CTX> : never;
type UnionSelection<T, CTX extends Context> = T extends any ? TypedSelection<T, CTX> : never;

export type TypedSelection<T, CTX extends Context = "loadable"> = {
    [K in Property.Keys<MergeUnion<T>, Context.Has<CTX>>]?: SelectedValue<Extract<MergeUnion<T>[K], Property>, CTX>;
};
