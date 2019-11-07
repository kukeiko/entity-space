export type Flag
    = "creatable"
    | "expandable"
    | "filterable"
    | "iterable"
    | "loadable"
    | "nullable"
    | "patchable"
    | "unique"
    | "voidable";

const flagMap: Record<Flag, true> = {
    creatable: true,
    expandable: true,
    filterable: true,
    iterable: true,
    loadable: true,
    nullable: true,
    patchable: true,
    unique: true,
    voidable: true
};

export function allFlags(): Flag[] {
    return Object.keys(flagMap) as Flag[];
}

export type Flagged<F extends Flag> = Record<F, true>;

export function setFlag<T extends object, F extends Flag>(toBeFlagged: T, flag: F): T & Flagged<F> {
    (toBeFlagged as any)[flag] = true;

    return toBeFlagged as any;
}

export function isFlagged<F extends Flag>(x: any, flag: F): x is Flagged<F> {
    return x?.[flag] === true;
}

export type IncludesFlag<T extends string[], F extends Flag> = undefined extends T ? false : F extends T[number] ? true : false;

export function includesFlag<F extends Flag>(flags: string[], flag: F): flags is F[] {
    return flags.indexOf(flag) !== -1;
}


type X = Flagged<["creatable"][number]>;
