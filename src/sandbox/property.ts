import { Type } from "./type";
import { Component as _Component } from "./component";
import { Instance } from "./instance";

export module Property {
    // [note] without this export, type hints while declaring properties on a type show the absolute path of the project
    export import Component = _Component;

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
        V extends _Component.Primitive.ValueType,
        A extends string = K,
        D = ReturnType<V>>
        = {
            fromDto(v: D): ReturnType<V>;
            toDto(v: ReturnType<V>): D;
        }
        & _Component.Dto<A, D, "u">
        & _Component.NotArray
        & _Component.Id
        & _Component.Local
        & _Component.Primitive<V>
        & _Component.Property<K, ReturnType<V>, "u">;

    export module Id {
        export type Keys<T> = Exclude<{ [P in keyof T]: T[P] extends Id<any, any> | undefined ? P : never }[keyof T], undefined>;

        export type Computed<
            K extends string,
            V extends _Component.Primitive.ValueType,
            T extends Type<string>,
            I extends _Component.Local.Keys<T> & string>
            = _Component.Computed<T, I, V>
            & _Component.Id
            & _Component.Local
            & _Component.Primitive<V>
            & _Component.Property<K, ReturnType<V>, "u">;
    }


    // export import Id = _Id;

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
        V extends _Component.Primitive.ValueType,
        M extends _Component.Modifier = never,
        A extends string = K,
        D = ReturnType<V>>
        = {
            fromDto(v: D): ReturnType<V>;
            toDto(v: ReturnType<V>): D;
        }
        & _Component.Dto<A, D, M>
        & _Component.NotArray
        & _Component.Local
        & _Component.Primitive<V>
        & _Component.Property<K, ReturnType<V>, M>;

    export module Primitive {
        export type Keys<T> = Exclude<{ [P in keyof T]: T[P] extends Primitive<any, any> | undefined ? P : never }[keyof T], undefined>;

        export type Computed<
            K extends string,
            V extends _Component.Primitive.ValueType,
            T extends Type<string>,
            I extends _Component.Local.Keys<T> & string,
            M extends "n" = never>
            = _Component.Computed<T, I, V, M>
            & _Component.Local
            & _Component.Primitive<V>
            & _Component.Property<K, ReturnType<V>, M>;

        export type Ethereal<
            K extends string,
            V extends _Component.Primitive.ValueType,
            M extends "n" = never>
            = _Component.Ethereal
            & _Component.Local
            & _Component.Primitive<V>
            & _Component.Property<K, ReturnType<V>, M>;

        export type Array<
            K extends string,
            V extends _Component.Primitive.ValueType,
            M extends _Component.Modifier = never,
            A extends string = K,
            D = ReturnType<V>>
            = {
                fromDto(v: D[]): ReturnType<V>[];
                toDto(v: ReturnType<V>[]): D[];
            }
            & _Component.Array
            & _Component.Dto<A, D[], M>
            & _Component.Local
            & _Component.Primitive<V>
            & _Component.Property<K, ReturnType<V>[]>;

        export module Array {
            export type Computed = {};
            export type Ethereal = {};
        }
    }

    /***
     *     ██████╗ ██████╗ ███╗   ███╗██████╗ ██╗     ███████╗██╗  ██╗
     *    ██╔════╝██╔═══██╗████╗ ████║██╔══██╗██║     ██╔════╝╚██╗██╔╝
     *    ██║     ██║   ██║██╔████╔██║██████╔╝██║     █████╗   ╚███╔╝
     *    ██║     ██║   ██║██║╚██╔╝██║██╔═══╝ ██║     ██╔══╝   ██╔██╗
     *    ╚██████╗╚██████╔╝██║ ╚═╝ ██║██║     ███████╗███████╗██╔╝ ██╗
     *     ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚═╝     ╚══════╝╚══════╝╚═╝  ╚═╝
     */
    export type Complex<
        K extends string,
        T extends Type<string>,
        M extends "n" | "p" | "c" = never,
        A extends string = K>
        = _Component.Complex
        & _Component.Dto<A, Partial<Instance.Dto<T>>, M>
        & _Component.Local
        & _Component.Navigable<T>
        & _Component.Property<K, Partial<Instance<T>>, M>;

    export module Complex {
        export type Computed
            = {};

        export type Ethereal<
            K extends string,
            T extends Type<string>,
            M extends "n" = never>
            = _Component.Complex
            & _Component.Ethereal
            & _Component.Local
            & _Component.Navigable<T>
            & _Component.Property<K, Partial<Instance<T>>, M>;

        export type Array<
            K extends string,
            T extends Type<string>,
            M extends "n" | "p" | "c" = never,
            A extends string = K>
            = _Component.Array
            & _Component.Dto<A, Instance.Dto<Partial<T>[]>, M>
            & _Component.Complex
            & _Component.Local
            & _Component.Navigable<T>
            & _Component.Property<K, Instance<Partial<T>[]>, M>;

        export module Array {
            export type Computed = {};
            export type Ethereal = {};
        }
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
        // P extends Reference.Id<any, T, any> | Reference.Id.Computed<any, T, any, any, any, any> | Reference.Id.Ethereal<any, T, any, any>,
        P extends _Component.ExternalId<T, any> & _Component.Property<any, any, any>,
        M extends _Component.Modifier = never,
        A extends string = K>
        = {
            localKey: P["key"];
        }
        // [todo] for some reason, ", M" only needs to be put @ either Component.Dto or Component.Property
        // (at least for nullability)
        & _Component.Dto<A, Partial<Instance.Dto<T>>, M>
        & _Component.Navigable.External<T>
        & _Component.Property<K, Partial<Instance<T>>, M>;

    export module Reference {
        export type Keys<T> = Exclude<{ [P in keyof T]: T[P] extends Reference<any, any, any> | undefined ? P : never }[keyof T], undefined>;

        export type Virtual<
            K extends string,
            T extends Type<string>,
            P extends _Component.ExternalId<T, any> & _Component.Property<any, any, any>,
            // P extends Reference.Id<any, T, any> | Reference.Id.Computed<any, T, any, any, any, any> | Reference.Id.Ethereal<any, T, any, any>,
            M extends _Component.Modifier = never>
            = {
                localKey: P["key"];
            }
            & _Component.Navigable.External<T>
            & _Component.Property<K, Partial<Instance<T>>, M>
            & _Component.Virtual;

        // export type Array<
        //     K extends string,
        //     T extends Type<string>,
        //     P extends Reference.Id.Keys<T>,
        //     M extends _Component.Modifier = never,
        //     A extends string = K>
        //     = {
        //         parentIdKey: P;
        //     }
        //     & _Component.Array
        //     & _Component.Dto<A, Instance.Dto<Partial<T>[]>, M>
        //     & _Component.Navigable.External<T>
        //     & _Component.Property<K, Instance<Partial<T>[]>, M>;

        export module Array {
            export type Virtual = {};
        }

        export type Id<
            K extends string,
            T extends Type<string>,
            P extends _Component.Modifier.Unique.Keys<T>,
            M extends _Component.Modifier = never,
            A extends string = K>
            = _Component.Dto<A, _Component.Dto.ValueOf<T[P]>, M>
            & _Component.ExternalId<T, P>
            & _Component.Local
            & _Component.Primitive<_Component.Primitive.ValueTypeOf<T[P]>>
            & _Component.Property<K, _Component.Property.ValueOf<T[P]>, M>;

        export module Id {
            export type Keys<T> = Exclude<{ [P in keyof T]: T[P] extends Id<any, any, any> | undefined ? P : never }[keyof T], undefined>;

            export type Computed<
                K extends string,
                T extends Type<string>,
                P extends _Component.Modifier.Unique.Keys<T>,
                U,
                I extends _Component.Local.Keys<U> & string,
                M extends "n" = never>
                = _Component.Computed<U, I, _Component.Primitive.ValueTypeOf<T[P]>, M>
                & _Component.ExternalId<T, P>
                & _Component.Local
                & _Component.Primitive<_Component.Primitive.ValueTypeOf<T[P]>>
                & _Component.Property<K, _Component.Property.ValueOf<T[P]>, M>;
            // & Component.Property<K, ReturnType<Component.Primitive.ValueTypeOf<T[P]>>, M>;

            export type Ethereal<
                K extends string,
                T extends Type<string>,
                P extends _Component.Modifier.Unique.Keys<T>,
                M extends "n" = never>
                = _Component.Ethereal
                & _Component.ExternalId<T, P>
                & _Component.Local
                & _Component.Primitive<_Component.Primitive.ValueTypeOf<T[P]>>
                & _Component.Property<K, _Component.Property.ValueOf<T[P]>, M>;
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
        M extends _Component.Modifier = never,
        A extends string = K>
        = {
            parentIdKey: P;
        }
        & _Component.Array
        & _Component.Dto<A, Instance.Dto<Partial<T>[]>, M>
        & _Component.Navigable.External<T>
        & _Component.Property<K, Instance<Partial<T>[]>, M>;
}
