export interface Creatable {
    creatable: true;
}

export module Creatable {
    export type Flag = "creatable";

    export module Flag {
        export type IsSet<F extends string[]> = undefined extends F ? false : Creatable.Flag extends F[number] ? true : false;

        export function isSet<F extends string[]>(f?: F): IsSet<F> {
            return f?.includes("creatable") || false as any;
        }
    }
}
