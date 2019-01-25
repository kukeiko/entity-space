import { Box, Unbox } from "../lang";
import { Property } from "../property";
import { Local } from "./local";
import { Unique } from "./unique";
import { External } from "./external";
import { Instance } from "../instance";

export type Reference<T, K extends string, I extends Reference.Key<T, any, any, any, any>, A extends string = K> = External<T, Instance<T>, K, A> & {
    key: I;
};

export module Reference {
    // [todo] not sure that "string &" is needed for 'F'
    // export type Key<T, K extends string, A extends string = K, F extends string & Unique.Keys<Unbox<T>> = string & Unique.Keys<Unbox<T>>, V = Property.ValueType<Property.WithKey<T, F>>, D = V>
    // [todo] Unbox<T> is very likely not needed
    export type Key<T, K extends string, F extends Unique.Keys<Unbox<T>>, A extends string = K, V = Box<Property.ValueType<Property.WithKey<Unbox<T>, F>>, T>, D = V>
        = Local<V, K, A, D> & {
            // [note] reason for existence is to give user more flexibility in their data design
            // by not enforcing that the primary key of the other type has to be used,
            // but instead allow choosing any (unique) property
            otherKey: F;
        };

    export module Key {
        export type Keys<T> = Exclude<{ [P in keyof T]: T[P] extends Key<infer _1, infer K, infer _2, infer _3> | undefined ? K : never }[keyof T], undefined>;
    }

    export type Virtual<T, K extends string, I extends Key<T, any, any, any, any>> = Reference<T extends any[] ? T : T | null, K, I, never> & {
        virtual: true;
    };
}
