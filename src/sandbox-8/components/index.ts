export * from "./creatable";
export * from "./expandable";
export * from "./nullable";
export * from "./patchable";
export * from "./unique";

export interface Iterable {
    iterable: true;
}


export interface Defaulted {
    defaulted: true;
}

export module Defaulted {
    export type Flag = "defaulted";

    export module Flag {
        export type IsSet<F extends string[]> = Defaulted.Flag extends F[number] ? true : false;

        export function isSet<F extends string[]>(f?: F): IsSet<F> {
            return f?.includes("defaulted") || false as any;
        }
    }
}
