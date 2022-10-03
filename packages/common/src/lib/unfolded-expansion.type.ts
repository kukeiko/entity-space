import { Unbox } from "@entity-space/utils";
import { Entity } from "./entity.type";

// [todo] use - idea was to pass this to EntityApiEndpoints to make life of user easier
// (remove having to check if a related expansion is "true" or an object)
export type UnfoldedExpansion<T = Entity, U = Unbox<T>> = {
    [K in keyof U]?: U[K] extends number | string | boolean ? true : UnfoldedExpansion<U[K]>;
};
