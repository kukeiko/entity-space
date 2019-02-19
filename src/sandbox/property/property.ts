import { Type } from "../type";
import { Component } from "../component";
import { Instance } from "../instance";

export module Property {
    /***
     *    ██╗██████╗
     *    ██║██╔══██╗
     *    ██║██║  ██║
     *    ██║██║  ██║
     *    ██║██████╔╝
     *    ╚═╝╚═════╝
     */
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

    /***
     *    ██████╗ ██████╗ ██╗███╗   ███╗██╗████████╗██╗██╗   ██╗███████╗
     *    ██╔══██╗██╔══██╗██║████╗ ████║██║╚══██╔══╝██║██║   ██║██╔════╝
     *    ██████╔╝██████╔╝██║██╔████╔██║██║   ██║   ██║██║   ██║█████╗
     *    ██╔═══╝ ██╔══██╗██║██║╚██╔╝██║██║   ██║   ██║╚██╗ ██╔╝██╔══╝
     *    ██║     ██║  ██║██║██║ ╚═╝ ██║██║   ██║   ██║ ╚████╔╝ ███████╗
     *    ╚═╝     ╚═╝  ╚═╝╚═╝╚═╝     ╚═╝╚═╝   ╚═╝   ╚═╝  ╚═══╝  ╚══════╝
     */
    export type Primitive<
        K extends string,
        V extends Component.Primitive.ValueType,
        A extends string = K,
        D = ReturnType<V>,
        M extends Component.Modifier = never>
        = {
            fromDto(v: D): ReturnType<V>;
            toDto(v: ReturnType<V>): D;
        }
        & Component.Dto<A, D, M>
        & Component.Local
        & Component.Primitive<V>
        & Component.Property<K, ReturnType<V>, M>;

    export module Primitive {
        export type Keys<T> = Exclude<{ [P in keyof T]: T[P] extends Primitive<any, any> | undefined ? P : never }[keyof T], undefined>;

        export type Computed<
            K extends string,
            V extends Component.Primitive.ValueType,
            T extends Type<string>,
            I extends Component.Local.Keys<T> & string>
            = Component.Computed<T, I, V>
            & Component.Local
            & Component.Primitive<V>
            & Component.Property<K, ReturnType<V>>;

        export type Ethereal<
            K extends string,
            V extends Component.Primitive.ValueType,
            M extends "n" = never>
            = Component.Ethereal
            & Component.Local
            & Component.Primitive<V>
            & Component.Property<K, ReturnType<V>, M>;

        export type Array<
            K extends string,
            V extends Component.Primitive.ValueType,
            A extends string = K,
            D = ReturnType<V>,
            M extends Component.Modifier = never>
            = {
                fromDto(v: D[]): ReturnType<V>[];
                toDto(v: ReturnType<V>[]): D[];
            }
            & Component.Array
            & Component.Dto<A, D[], M>
            & Component.Local
            & Component.Primitive<V>
            & Component.Property<K, ReturnType<V>[]>;
    }

    /***
     *    ██████╗ ███████╗███████╗███████╗██████╗ ███████╗███╗   ██╗ ██████╗███████╗
     *    ██╔══██╗██╔════╝██╔════╝██╔════╝██╔══██╗██╔════╝████╗  ██║██╔════╝██╔════╝
     *    ██████╔╝█████╗  █████╗  █████╗  ██████╔╝█████╗  ██╔██╗ ██║██║     █████╗
     *    ██╔══██╗██╔══╝  ██╔══╝  ██╔══╝  ██╔══██╗██╔══╝  ██║╚██╗██║██║     ██╔══╝
     *    ██║  ██║███████╗██║     ███████╗██║  ██║███████╗██║ ╚████║╚██████╗███████╗
     *    ╚═╝  ╚═╝╚══════╝╚═╝     ╚══════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═══╝ ╚═════╝╚══════╝
     */
    export type Reference<
        K extends string,
        T extends Type<string>,
        P extends Reference.Id<any, T, any>,
        A extends string = K,
        M extends Component.Modifier = never>
        = {
            localKey: P;
        }
        // [todo] for some reason, ", M" only needs to be put @ either Component.Dto or Component.Property
        // (at least for nullability)
        & Component.Dto<A, Partial<Instance.Dto<T>>, M>
        & Component.Navigable.External<T>
        & Component.Property<K, Partial<Instance<T>>, M>;

    export module Reference {
        export type Keys<T> = Exclude<{ [P in keyof T]: T[P] extends Reference<any, any, any> | undefined ? P : never }[keyof T], undefined>;

        export type Id<
            K extends string,
            T extends Type<string>,
            P extends Component.Modifier.Unique.Keys<T>,
            // P extends Component.Unique.Keys<T>,
            A extends string = K,
            M extends Component.Modifier = never>
            = {
                // otherId: T[P];
                otherIdKey: P;
            }
            & Component.Local
            & Component.Primitive<Component.Primitive.ValueTypeOf<T[P]>>
            & Component.Property<K, Component.Property.ValueOf<T[P]>, M>
            & Component.Dto<A, Component.Dto.ValueOf<T[P]>, M>
            ;

        export module Id {
            export type Keys<T> = Exclude<{ [P in keyof T]: T[P] extends Id<any, any, any> | undefined ? P : never }[keyof T], undefined>;
        }

        export type Virtual = {};

        export type Array = {};

        export module Array {
            export type Virtual = {};
        }
    }

    /***
     *    ██████╗  █████╗ ██████╗ ███████╗███╗   ██╗████████╗
     *    ██╔══██╗██╔══██╗██╔══██╗██╔════╝████╗  ██║╚══██╔══╝
     *    ██████╔╝███████║██████╔╝█████╗  ██╔██╗ ██║   ██║
     *    ██╔═══╝ ██╔══██║██╔══██╗██╔══╝  ██║╚██╗██║   ██║
     *    ██║     ██║  ██║██║  ██║███████╗██║ ╚████║   ██║
     *    ╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═══╝   ╚═╝
     */
    export type Parent = {};

    /***
     *     ██████╗ ██████╗ ██╗     ██╗     ███████╗ ██████╗████████╗██╗ ██████╗ ███╗   ██╗
     *    ██╔════╝██╔═══██╗██║     ██║     ██╔════╝██╔════╝╚══██╔══╝██║██╔═══██╗████╗  ██║
     *    ██║     ██║   ██║██║     ██║     █████╗  ██║        ██║   ██║██║   ██║██╔██╗ ██║
     *    ██║     ██║   ██║██║     ██║     ██╔══╝  ██║        ██║   ██║██║   ██║██║╚██╗██║
     *    ╚██████╗╚██████╔╝███████╗███████╗███████╗╚██████╗   ██║   ██║╚██████╔╝██║ ╚████║
     *     ╚═════╝ ╚═════╝ ╚══════╝╚══════╝╚══════╝ ╚═════╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝
     */
    export type Collection = {

    };

    /***
     *     ██████╗██╗  ██╗██╗██╗     ██████╗
     *    ██╔════╝██║  ██║██║██║     ██╔══██╗
     *    ██║     ███████║██║██║     ██║  ██║
     *    ██║     ██╔══██║██║██║     ██║  ██║
     *    ╚██████╗██║  ██║██║███████╗██████╔╝
     *     ╚═════╝╚═╝  ╚═╝╚═╝╚══════╝╚═════╝
     */
    // export type Child<T, P extends Reference.Keys<U>, A extends string = string, U = Unbox<Exclude<T, null>>>
    // export type Child<K extends string, T, P extends Reference.Keys<U>, A extends string = K, U = Exclude<Unbox<Exclude<T, null>>, null>>
    // export type Child<
    //     K extends string,
    //     T extends ,
    //     P extends Reference.Keys<U>,
    //     A extends string = K,
    //     U extends Type<string> = Exclude<Unbox<Exclude<T, null>>, null>>
    //     = {
    //         parentReference: U[P];
    //     } & Component.Navigable<U>;
    // ;

    /***
     *     ██████╗██╗  ██╗██╗██╗     ██████╗ ██████╗ ███████╗███╗   ██╗
     *    ██╔════╝██║  ██║██║██║     ██╔══██╗██╔══██╗██╔════╝████╗  ██║
     *    ██║     ███████║██║██║     ██║  ██║██████╔╝█████╗  ██╔██╗ ██║
     *    ██║     ██╔══██║██║██║     ██║  ██║██╔══██╗██╔══╝  ██║╚██╗██║
     *    ╚██████╗██║  ██║██║███████╗██████╔╝██║  ██║███████╗██║ ╚████║
     *     ╚═════╝╚═╝  ╚═╝╚═╝╚══════╝╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═══╝
     */
    export type Children<
        K extends string,
        T extends Type<string>,
        P extends Reference.Id.Keys<T>,
        A extends string = K,
        M extends Component.Modifier = never>
        = {
            parentIdKey: P;
        }
        & Component.Array
        & Component.Dto<A, Instance.Dto<Partial<T>[]>, M>
        & Component.Navigable.External<T>
        & Component.Property<K, Instance<Partial<T>[]>, M>;
}
