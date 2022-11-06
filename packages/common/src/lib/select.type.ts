// [todo] Expand expression needs to be this one liner instead of having it split up like the commented out code below,
// otherwise expanding on properties across multiple discriminated union types won't make them non-voidable.
// i have no idea why and would love to figure it out.
// type ExpandValue<T, E> = T extends number | string ? Exclude<T, undefined> : T extends any[] ? Expand<T[number], E>[] : T & Expand<T, E>;
// export type Expand<T, E> = T & { [K in keyof (T | E)]-?: ExpandValue<T[K], E[K]> };
// [update] the comment is quite old and having it split up isn't really an improvement anymore,
// but i'd still like to learn why that issue w/ discriminated union types happens (if it even still does)

export type Select<T, E> = E extends true
    ? Exclude<T, undefined>
    : T extends any[]
    ? Select<T[number], E>[]
    : T & { [K in keyof (T | E)]-?: Select<T[K], E[K]> };
