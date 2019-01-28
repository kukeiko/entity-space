import { Box, Unbox } from "../lang";
import { Property } from "../property";
import { Instance } from "../instance";
import { Local } from "./local";
import { Unique } from "./unique";
import { External } from "./external";

export type Reference<T, K extends string, P extends Reference.Id<T, any, any, any, any, any>, A extends string = K, V = Box<Instance<Unbox<T>>, T>> = {
    localKey: P;
} & External<Unbox<T>, V, K, A>;

export module Reference {
    export type Keys<T> = keyof T & Exclude<{ [P in keyof T]: T[P] extends Reference<infer _1, infer K, infer _3, infer _4, infer _5> | undefined ? K : never }[keyof T], undefined>;

    export type Id<
        T,
        K extends string,
        P extends Unique.Keys<U> & keyof U,
        A extends string = K,
        V = Box<Property.ValueType<Property.WithKey<U, P>>, U>,
        D = V,
        U = Unbox<Exclude<T, null>>> = {
            otherKey: U[P];
        } & Local<V, K, A, D>;

    export module Id {
        export type Keys<T> = keyof T & Exclude<{ [P in keyof T]: T[P] extends Id<infer _1, infer K, infer _2, infer _3> | undefined ? K : never }[keyof T], undefined>;

        export type Creatable<
            T,
            K extends string,
            P extends Unique.Keys<Unbox<Exclude<T, null>>> & keyof Unbox<Exclude<T, null>>,
            A extends string = K,
            V = Box<Property.ValueType<Property.WithKey<Unbox<Exclude<T, null>>, P>>, Exclude<T, null>>,
            D = V> = Local.Creatable<V, K, A, D> & Id<T, K, P, A, V, D>;

        export module Creatable {
            // [note] the first "any" is on purpose, otherwise Patchable.Keys aren't included
            export type Keys<T> = keyof T & Exclude<{ [P in keyof T]: T[P] extends Creatable<any, infer K, infer _2, infer _3, infer _4, infer _5> | undefined ? K : never }[keyof T], undefined>;
        }

        // [todo]: mention in the docs that it is assumed that every property that can be patched
        // (changed after the entity has been persisted to db) also has to be creatable (definable
        // at time of entity creation; first persistence to db)
        export type Patchable<
            T,
            K extends string,
            P extends Unique.Keys<Unbox<Exclude<T, null>>> & keyof Unbox<Exclude<T, null>>,
            A extends string = K,
            V = Box<Property.ValueType<Property.WithKey<Unbox<Exclude<T, null>>, P>>, Exclude<T, null>>,
            D = V> = Local.Patchable<V, K, A, D> & Creatable<T, K, P, A, V, D>;

        export module Patchable {
            export type Keys<T> = keyof T & Exclude<{ [P in keyof T]: T[P] extends Patchable<infer _1, infer K, infer _2, infer _3, infer _4, infer _5> | undefined ? K : never }[keyof T], undefined>;
        }
    }

    // export type Virtual<T, K extends string, P extends Id<T, any, any, any, any>, A extends string = K, U = Unbox<T>> = {
    export type Virtual<T, K extends string, P extends Id<T, any, any, any, any>, A extends string = K, U = T extends any[] ? Instance<U>[] : Instance<T> | null> = {
        virtual: true;
    } & Reference<T, K, P, A, T extends any[] ? Instance<U>[] : Instance<T> | null>;
    // } & Reference<T, K, P, A, T extends any[] ? Instance<U>[] : Instance<T> | null>;
}
