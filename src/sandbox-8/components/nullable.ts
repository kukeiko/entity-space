export interface Nullable {
    nullable: true;
}

export module Nullable {
    export type Flag = "nullable";

    export module Flag {
        export type IsSet<F extends string[]> = Nullable.Flag extends F[number] ? true : false;

        export function isSet<F extends string[]>(f?: F): IsSet<F> {
            return f?.includes("nullable") || false as any;
        }
    }
}
