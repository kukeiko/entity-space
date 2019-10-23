export interface Filterable {
    filterable: true;
}

export module Filterable {
    export type Flag = "filterable";

    export module Flag {
        export type IsSet<F extends string[]> = Filterable.Flag extends F[number] ? true : false;

        export function isSet<F extends string[]>(f?: F): IsSet<F> {
            return f?.includes("filterable") || false as any;
        }
    }
}
