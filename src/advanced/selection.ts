import { Property } from "./property";
import { Context } from "./context";
import { Primitive } from "../utils";

type SelectedValue<P extends Property, CTX extends Context> = P["value"] extends Primitive
    ? true
    : any[] extends P["value"]
    ? UnionSelection<Property.UnboxedValue<P>, CTX> | true
    : ModelSelection<Property.UnboxedValue<P>, CTX> | true;

type UnionSelection<T, CTX extends Context> = T extends any ? ModelSelection<T, CTX> : never;

export type ModelSelection<ST, CTX extends Context = "loadable"> = {
    [K in Property.Keys<ST, Context.Has<CTX, boolean, true>>]?: SelectedValue<ST[K], CTX>;
};

export type UntypedModelSelection = { [key: string]: true | UntypedModelSelection };

export module ModelSelection {
    export function merge(...selections: UntypedModelSelection[]): UntypedModelSelection {
        const merged: UntypedModelSelection = {};

        for (const selection of selections) {
            for (const key in selection) {
                const left = merged[key];
                const right = selection[key];

                if (right === void 0) {
                    continue;
                }

                if (left === void 0 || left === true) {
                    if (right === true) {
                        merged[key] = true;
                    } else {
                        merged[key] = copy(right);
                    }
                } else if (right !== true) {
                    merged[key] = merge(left, right);
                }
            }
        }

        return merged;
    }

    export function copy(selection: UntypedModelSelection): UntypedModelSelection {
        return merge(selection, {});
    }

    export function reduce(a: UntypedModelSelection, b: UntypedModelSelection): UntypedModelSelection | null {
        if (Object.keys(a).length === 0) {
            return null;
        }

        const reduced = copy(a);
        let didReduce = false;

        for (const key in b) {
            if (a[key] === void 0) {
                continue;
            } else if (b[key] === true) {
                delete reduced[key];
                didReduce = true;
            } else if (b[key] instanceof Object) {
                const subReduced = reduce(reduced[key] as UntypedModelSelection, b[key] as UntypedModelSelection);

                if (subReduced === null) {
                    delete reduced[key];
                    didReduce = true;
                } else if (subReduced === reduced[key]) {
                    continue;
                } else {
                    reduced[key] = subReduced;
                    didReduce = true;
                }
            }
        }

        if (!didReduce) {
            return a;
        } else if (Object.keys(reduced).length === 0) {
            return null;
        } else {
            return reduced;
        }
    }

    /**
     * Determines if a is a superset of b.
     */
    export function isSuperset(a: UntypedModelSelection, b: UntypedModelSelection): boolean {
        /**
         * [todo] lazy implementation - it works, but we should have an algorithm that
         * exits early instead of making a full reduction, otherwise we'll have unnecessary cpu cycles,
         * and this method is on the critical path.
         */
        return reduce(b, a) === null;
    }
}
