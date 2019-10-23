export interface Unique {
    unique: true;
}

export module Unique {
    export type Flag = "unique";

    export module Flag {
        export type IsSet<F extends string[]> = Unique.Flag extends F[number] ? true : false;

        export function isSet<F extends string[]>(f?: F): IsSet<F> {
            return f?.includes("unique") || false as any;
        }
    }
}
