type ExpansionValue<T> = T extends number | string
    ? true
    : T extends any[]
    ? Expansion<T[number]> | true
    : Expansion<T> | true;

export type Expansion<T = Record<string, unknown>> = { [K in keyof T]?: ExpansionValue<T[K]> };

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
