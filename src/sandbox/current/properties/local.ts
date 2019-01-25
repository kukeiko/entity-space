import { Property } from "../property";

export type Local<V, K extends string, A extends string = K, D = V> = {
    local: true;
    fromDto: (dtoValue: D) => V;
    toDto: (value: V) => D;
} & Property.Dto<V, K, A, D>;

export module Local {
    export type Keys<T> = Exclude<{ [P in keyof T]: T[P] extends Local<any, any> | undefined ? P : never }[keyof T], undefined>;

    export type Creatable<
        V,
        K extends string,
        A extends string,
        D = V> = {
            creatable: true;
        } & Local<V, K, A, D>;

    export module Creatable {
        export type Keys<T> = keyof T & Exclude<{ [P in keyof T]: T[P] extends Creatable<infer _1, infer K, infer _2, infer _3> | undefined ? K : never }[keyof T], undefined>;
    }

    export type Patchable<
        V,
        K extends string,
        A extends string,
        D = V> = {
            patchable: true;
        } & Creatable<V, K, A, D>;

    export module Patchable {
        export type Keys<T> = keyof T & Exclude<{ [P in keyof T]: T[P] extends Patchable<infer _1, infer K, infer _2, infer _3> | undefined ? K : never }[keyof T], undefined>;
    }

    // export type Mutable<V, K extends string, A extends string = K, D = V> = {
    //     mutable: true;
    // } & Local<VBArray, K, A, D>;

    export type Computed<V, K extends string, T, I extends Keys<T>, A extends string = K, D = V> = {
        computeValue(instance: { [P in I]: P extends string ? Property.WithKey<T, P> : never }): V;
    } & Local<V, K, A, D>;

    export type All<T> = { [P in Keys<T>]: T[P]; };
    export type Properties<T> = { [P in Keys<T>]: T[P]; };
    export type Selected<T> = { [P in keyof Properties<T>]: T[P] extends Local<infer R, any> ? R : never; };
    // type SelectedLocals<T> = { [P in keyof Locals<T>]: T[P] extends Local<infer R> ? R : never; };
    // export type Selected<T> = { [P in keyof Locals<T>]: T[P] extends Local<infer R> ? R : never; };
}
