import { Component } from "../component";
import { Type } from "../type";

export type Id<
    K extends string,
    V extends Component.Primitive.ValueType,
    A extends string = K,
    D = ReturnType<V>>
    = {
        fromDto(v: D): ReturnType<V>;
        toDto(v: ReturnType<V>): D;
    }
    & Component.Dto<A, D, "u">
    & Component.NotArray
    & Component.Id
    & Component.Local
    & Component.Primitive<V>
    & Component.Property<K, ReturnType<V>, "u">;

export module Id {
    export type Keys<T> = Exclude<{ [P in keyof T]: T[P] extends Id<any, any> | undefined ? P : never }[keyof T], undefined>;

    export type Computed<
        K extends string,
        V extends Component.Primitive.ValueType,
        T extends Type<string>,
        I extends Component.Local.Keys<T> & string>
        = Component.Computed<T, I, V>
        & Component.Id
        & Component.Local
        & Component.Primitive<V>
        & Component.Property<K, ReturnType<V>, "u">;
}
