export interface Patchable {
    patchable: true;
}

export module Patchable {
    export type Flag = "patchable";

    export module Flag {
        export type IsSet<F extends string[]> = undefined extends F ? false : Patchable.Flag extends F[number] ? true : false;

        export function isSet<F extends string[]>(f?: F): IsSet<F> {
            return f?.includes("patchable") || false as any;
        }
    }
}
