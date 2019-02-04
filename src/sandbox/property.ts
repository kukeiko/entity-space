import { Type } from "./type";
import { Component } from "./component";
import { Instance } from "./instance";

export module Property {

    /***
     *    ██╗██████╗
     *    ██║██╔══██╗
     *    ██║██║  ██║
     *    ██║██║  ██║
     *    ██║██████╔╝
     *    ╚═╝╚═════╝
     */
    export type Id<K extends string, V, A extends string = K, D = V, M extends Component.Property.Modifier = never>
        = Component.Dto<A, D, M>
        & Component.Id
        & Component.Local
        & Component.Property<K, V, M>
        & Component.Unique
        ;

    export module Id {

    }

    /***
     *    ███████╗██╗███╗   ███╗██████╗ ██╗     ███████╗
     *    ██╔════╝██║████╗ ████║██╔══██╗██║     ██╔════╝
     *    ███████╗██║██╔████╔██║██████╔╝██║     █████╗
     *    ╚════██║██║██║╚██╔╝██║██╔═══╝ ██║     ██╔══╝
     *    ███████║██║██║ ╚═╝ ██║██║     ███████╗███████╗
     *    ╚══════╝╚═╝╚═╝     ╚═╝╚═╝     ╚══════╝╚══════╝
     */
    export type Simple<
        K extends string,
        C extends Simple.Cloner,
        A extends string = K,
        D = ReturnType<C>,
        M extends Component.Property.Modifier = never
        > = {
            clone: Exclude<C, null>;
        }
        & Component.Dto<A, D, M>
        & Component.Local
        & Component.Property<K, ReturnType<C>, M>;

    export module Simple {
        export type Cloner = ((...args: any[]) => any);
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
        M extends Component.Property.Modifier = never> = {
            localKey: P;
        }
        // [todo] for some reason, ", M" only needs to be put @ either Component.Dto or Component.Property
        // (at least for nullability)
        & Component.Dto<A, Partial<Instance.Dto<T>>, M>
        & Component.External
        & Component.Navigable<T>
        & Component.Property<K, Partial<Instance<T>>, M>;

    export module Reference {
        export type Keys<T> = Exclude<{ [P in keyof T]: T[P] extends Reference<any, any, any> | undefined ? P : never }[keyof T], undefined>;

        export type Id<
            K extends string,
            T extends Type<string>,
            P extends Component.Unique.Keys<T>,
            A extends string = K,
            M extends Component.Property.Modifier = never>
            = {
                // otherId: T[P];
                otherIdKey: P;
            }
            & Component.Local
            & Component.Property<K, Component.Property.ValueOf<T[P]>, M>
            & Component.Dto<A, Component.Dto.ValueOf<T[P]>, M>
            ;

        export module Id {
            export type Keys<T> = Exclude<{ [P in keyof T]: T[P] extends Id<any, any, any> | undefined ? P : never }[keyof T], undefined>;
        }

        export type Virtual = {};
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
        M extends Component.Property.Modifier = never> = {
            parentIdKey: P;
        }
        & Component.Array
        // & Component.Dto<A, Partial<Instance.Dto<T[]>>, M>
        & Component.Dto<A, Instance.Dto<Partial<T>[]>, M>
        & Component.External
        & Component.Navigable<T>
        // & Component.Property<K, Partial<Instance<T[]>>, M>;
        & Component.Property<K, Instance<Partial<T>[]>, M>;

}
