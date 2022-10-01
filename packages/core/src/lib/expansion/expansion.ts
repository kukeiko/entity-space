import { ExpansionValue } from "@entity-space/common";
import { Unbox } from "@entity-space/utils";
import { Entity } from "../entity";

// [todo] use
export type UnfoldedExpansion<T = Entity, U = Unbox<T>> = {
    [K in keyof U]?: U[K] extends number | string ? true : UnfoldedExpansion<U[K]>;
};

// [todo] Expand expression needs to be this one liner instead of having it split up like the commented out code below,
// otherwise expanding on properties across multiple discriminated types won't make them non-voidable.
// i have no idea why and would love to figure it out.
// type ExpandValue<T, E> = T extends number | string ? Exclude<T, undefined> : T extends any[] ? Expand<T[number], E>[] : T & Expand<T, E>;
// export type Expand<T, E> = T & { [K in keyof (T | E)]-?: ExpandValue<T[K], E[K]> };

// [todo] maybe we can get rid of the "valueOf" thingy by checking E against true, and if so, immediately return Exclude<T, undefined>?

export type Expand<T, E> = T extends number | string | null
    ? Exclude<T, undefined>
    : T extends any[]
    ? Expand<T[number], E>[]
    : "valueOf" extends keyof E // dirty solution, but cleaner for intellisense
    ? T
    : T & { [K in keyof (T | E)]-?: Expand<T[K], E[K]> };

export class Expansion {
    constructor(value: ExpansionValue) {
        this.value = value;
    }

    private readonly value: ExpansionValue;

    getValue(): ExpansionValue {
        return this.value;
    }

    isEmpty(): boolean {
        return Object.keys(this.value).length === 0;
    }

    reduce(other: Expansion): boolean | Expansion {
        if (other.isEmpty()) {
            return true;
        }

        const reduced = Expansion.reduceValue(other.getValue(), this.getValue());

        if (typeof reduced == "boolean") {
            return reduced;
        } else {
            return new Expansion(reduced);
        }
    }

    intersect(other: Expansion): false | Expansion {
        const intersection = Expansion.intersectValues(this.getValue(), other.getValue());

        return intersection ? new Expansion(intersection) : false;
    }

    static intersectValues(a: ExpansionValue, b: ExpansionValue): false | ExpansionValue {
        const intersection: ExpansionValue = {};

        for (const key in a) {
            const myValue = a[key];
            const otherValue = b[key];

            if (myValue === void 0 || otherValue === void 0) {
                continue;
            }

            if (myValue === true) {
                if (otherValue === true) {
                    intersection[key] = true;
                } else {
                    intersection[key] = otherValue;
                }
            } else {
                if (otherValue === true) {
                    intersection[key] = myValue;
                } else {
                    const intersectedValue = this.intersectValues(myValue, otherValue);

                    if (intersectedValue) {
                        intersection[key] = intersectedValue;
                    }
                }
            }
        }

        return Object.keys(intersection).length ? intersection : false;
    }

    merge(other: Expansion): Expansion {
        return new Expansion(Expansion.mergeValues(this.getValue(), other.getValue()));
    }

    static copyValue(object: ExpansionValue): ExpansionValue {
        return this.mergeValues(object);
    }

    static mergeValues(...objects: ExpansionValue[]): ExpansionValue {
        const merged: ExpansionValue = {};

        for (let selection of objects) {
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
                        merged[key] = this.mergeValues(right);
                    }
                } else if (right !== true) {
                    merged[key] = this.mergeValues(left, right);
                }
            }
        }

        return merged;
    }

    static reduceValue(what: ExpansionValue, by: ExpansionValue): boolean | ExpansionValue {
        if (Object.keys(what).length === 0) {
            return true;
        }

        const reduced = this.copyValue(what);
        let didReduce = false;

        for (const key in by) {
            const whatValue = what[key];
            const byValue = by[key];

            if (!whatValue) {
                continue;
            } else if (byValue === true) {
                if (whatValue === true || Object.keys(what[key] ?? {}).length === 0) {
                    delete reduced[key];
                    didReduce = true;
                }
            } else if (typeof byValue === "object" && typeof whatValue === "object") {
                const subReduced = this.reduceValue(whatValue, byValue);

                if (!subReduced) {
                    continue;
                } else if (Object.keys(subReduced).length === 0) {
                    delete reduced[key];
                    didReduce = true;
                } else {
                    reduced[key] = subReduced;
                    didReduce = true;
                }
            } else if (typeof byValue === "object" && whatValue === true) {
                if (Object.keys(byValue).length == 0) {
                    delete reduced[key];
                    didReduce = true;
                }
            }
        }

        if (!didReduce) {
            return false;
        } else if (Object.keys(reduced).length === 0) {
            return true;
        } else {
            return reduced;
        }
    }
}
