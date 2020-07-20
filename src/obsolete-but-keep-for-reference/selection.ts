import { Unbox, Box } from "../utils";

type SelectablePropertyKeys<T> = Exclude<
    {
        [K in keyof T]: undefined extends T[K] // any property that is undefined is optional, and therefore available for selection
            ? K // any property where the referenced type has optional properties (deep check) should also be selectable
            : HasDeepOptionalProperty<Exclude<T[K], null>> extends true
            ? K // otherwise it's not selectable
            : never;
    }[keyof T],
    undefined
>;

/**
 * language workaround needed in case T is a union, e.g. Square | Circle.
 *
 * [todo] copied from stackoverflow, but forgot to add the link. finding it again shouldn't be too hard :) (keyword: "distributed unions" as far as i remember)
 */
type UnionSelection<T> = T extends any ? Selection<T> : never;

/**
 * Evaluates to true if given type T has (?)
 *
 * [todo] try to simplify this type, it's really hard to read
 */
type HasDeepOptionalProperty<T> =
    // i no longer remember why i added this line - can possibly be removed
    Exclude<T, undefined> extends boolean | number | string
        ? false // [todo] rethink this - i think it can be simplified
        : SelectablePropertyKeys<T> extends never
        ? {
              [K in keyof T]: HasDeepOptionalProperty<T[K]> extends true ? true : never;
          }[keyof T] extends never
            ? false
            : true
        : true;

/**
 * A selection describes which properties should be included for an operation (like loading entities).
 */
export type Selection<T = any> = {
    [K in SelectablePropertyKeys<T>]?: Exclude<T[K], undefined | null> extends boolean | number | string ? true : UnionSelection<Exclude<Unbox<T[K]>, undefined | null>> | true;
};

export module Selection {
    type SelectedPropertyKeys<T, S> = Exclude<
        { [K in keyof S]: K extends keyof T ? (S[K] extends true ? K : S[K] extends Selection<T[K]> ? K : never) : never }[keyof S],
        undefined
    >;

    type SelectedProperty<T, S extends Selection<T>, K extends keyof T & keyof S> = S[K] extends true
        ? Exclude<T[K], undefined>
        : S[K] extends Selection<Exclude<Unbox<T[K]>, undefined | null>>
        ? Box<Apply<Exclude<Unbox<T[K]>, undefined | null>, S[K]>, Exclude<T[K], undefined | null>>
        : never;

    export type Apply<T, S extends Selection<T>> = T &
        {
            [K in SelectedPropertyKeys<T, S>]: SelectedProperty<T, S, K>;
        };

    export function merge(...selections: Selection[]): Selection {
        const merged: Selection = {};

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

    export function copy(selection: Selection): Selection {
        return merge(selection, {});
    }

    export function reduce(a: Selection, b: Selection): Selection | null {
        if (Object.keys(a).length === 0) {
            return null;
        }

        const reduced = copy(a);
        let didReduce = false;

        for (const key in b) {
            if (a[key] === void 0) {
                continue;
            } else if (a[key] === true && b[key] === true) {
                delete reduced[key];
                didReduce = true;
            } else if (a[key] instanceof Object && b[key] instanceof Object) {
                const subReduced = reduce(reduced[key] as Selection, b[key] as Selection);

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
    export function isSuperset(a: Selection, b: Selection): boolean {
        /**
         * [todo] lazy implementation - it works, but we should have an algorithm that
         * exits early instead of making a full reduction, otherwise we'll have unnecessary cpu cycles,
         * and this method is on the critical path.
         */
        return reduce(b, a) === null;
    }
}
