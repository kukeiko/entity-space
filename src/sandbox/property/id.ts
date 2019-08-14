import { Component } from "../component";
import { Type } from "../type";

/**
 * [todo]
 * should support (c)reatable modifier
 */
export type Id<
    K extends string,
    V extends Component.Primitive.ValueType,
    A extends string = K,
    D extends Component.Primitive.ValueType = V>
    = {
        fromDto(v: ReturnType<D>): ReturnType<V>;
        toDto(v: ReturnType<V>): ReturnType<D>;
    }
    & Component.Dto<A, ReturnType<D>, "u">
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
