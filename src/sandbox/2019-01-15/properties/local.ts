import { Property } from "../property";

export type Local<V, K extends string, A extends string = K, D = V> = Property.Dto<V, K, A, D> & {
    local: true;
    readonly: boolean;
};

export module Local {
    // export type Selectable<V, K extends string, A extends string = K, D = V> = Local<V, K, A, D> & {
    //     selectable: true;
    // };

    // export module Selectable {
    //     export type Keys<T> = Exclude<{ [P in keyof T]: T[P] extends Selectable<any, any> | undefined ? P : never }[keyof T], undefined>;
    // }

    export type Keys<T> = Exclude<{ [P in keyof T]: T[P] extends Local<any, any> | undefined ? P : never }[keyof T], undefined>;
    export type All<T> = { [P in Keys<T>]: T[P]; };
    export type Properties<T> = { [P in Keys<T>]: T[P]; };
    export type Selected<T> = { [P in keyof Properties<T>]: T[P] extends Local<infer R, any> ? R : never; };
    // type SelectedLocals<T> = { [P in keyof Locals<T>]: T[P] extends Local<infer R> ? R : never; };
    // export type Selected<T> = { [P in keyof Locals<T>]: T[P] extends Local<infer R> ? R : never; };
}
