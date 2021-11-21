type ExpansionValue<T> = T extends number | string ? true : T extends any[] ? Expansion<T[number]> | true : Expansion<T> | true;

export type Expansion<T = Record<string, unknown>> = { [K in keyof T]?: ExpansionValue<T[K]> };

// [todo] Expand expression needs to be this one liner instead of having it split up like the commented out code below,
// otherwise expanding on properties across multiple discriminated types won't make them non-voidable.
// i have no idea why and would love to figure it out.
// type ExpandValue<T, E> = T extends number | string ? Exclude<T, undefined> : T extends any[] ? Expand<T[number], E>[] : T & Expand<T, E>;
// export type Expand<T, E> = T & { [K in keyof (T | E)]-?: ExpandValue<T[K], E[K]> };
export type Expand<T, E> = T extends number | string | null
    ? Exclude<T, undefined>
    : T extends any[]
    ? Expand<T[number], E>[]
    : "valueOf" extends keyof E // dirty solution, but cleaner for intellisense
    ? T
    : T & { [K in keyof (T | E)]-?: Expand<T[K], E[K]> };

export function mergeExpansions(...selections: Expansion[]): Expansion {
    const merged: Expansion = {};

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
                    merged[key] = copyExpansion(right);
                }
            } else if (right !== true) {
                merged[key] = mergeExpansions(left, right);
            }
        }
    }

    return merged;
}

export function copyExpansion(selection: Expansion): Expansion {
    return mergeExpansions(selection, {});
}

export function reduceExpansion(a: Expansion, b: Expansion): Expansion | false {
    if (Object.keys(a).length === 0) {
        return {};
    }

    const reduced = copyExpansion(a);
    let didReduce = false;

    for (const key in b) {
        if (a[key] === void 0) {
            continue;
        } else if (b[key] === true) {
            delete reduced[key];
            didReduce = true;
        } else if (b[key] instanceof Object) {
            const subReduced = reduceExpansion(reduced[key] as Expansion, b[key] as Expansion);

            if (!subReduced) {
                continue;
            } else if (Object.keys(subReduced).length === 0) {
                delete reduced[key];
                didReduce = true;
            } else {
                reduced[key] = subReduced;
                didReduce = true;
            }
        }
    }

    return didReduce ? reduced : false;
}
