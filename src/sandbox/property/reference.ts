import { Component } from "../component";
import { Type } from "../type";
import { Instance } from "../instance";

export type Reference<
    K extends string,
    T extends Type<string>,
    // P extends Reference.Id<any, T, any> | Reference.Id.Computed<any, T, any, any, any, any> | Reference.Id.Ethereal<any, T, any, any>,
    P extends Component.ExternalId<T, any> & Component.Property<any, any, any>,
    M extends Component.Modifier = never,
    A extends string = K>
    = {
        localKey: P["key"];
    }
    // [todo] for some reason, ", M" only needs to be put @ either Component.Dto or Component.Property
    // (at least for nullability)
    & Component.Dto<A, Partial<Instance.Dto<T>>, M>
    & Component.Navigable.External<T>
    & Component.Property<K, Partial<Instance<T>>, M>;

export module Reference {
    export type Keys<T> = Exclude<{ [P in keyof T]: T[P] extends Reference<any, any, any> | undefined ? P : never }[keyof T], undefined>;

    export type Virtual<
        K extends string,
        T extends Type<string>,
        P extends Component.ExternalId<T, any> & Component.Property<any, any, any>,
        // P extends Reference.Id<any, T, any> | Reference.Id.Computed<any, T, any, any, any, any> | Reference.Id.Ethereal<any, T, any, any>,
        M extends Component.Modifier = never>
        = {
            localKey: P["key"];
        }
        & Component.Navigable.External<T>
        & Component.Property<K, Partial<Instance<T>>, M>
        & Component.Virtual;

    // export type Array<
    //     K extends string,
    //     T extends Type<string>,
    //     P extends Reference.Id.Keys<T>,
    //     M extends Component.Modifier = never,
    //     A extends string = K>
    //     = {
    //         parentIdKey: P;
    //     }
    //     & Component.Array
    //     & Component.Dto<A, Instance.Dto<Partial<T>[]>, M>
    //     & Component.Navigable.External<T>
    //     & Component.Property<K, Instance<Partial<T>[]>, M>;

    export module Array {
        export type Virtual = {};
    }

    export type Id<
        K extends string,
        T extends Type<string>,
        P extends Component.Modifier.Unique.Keys<T>,
        M extends Component.Modifier = never,
        A extends string = K>
        = Component.Dto<A, Component.Dto.ValueOf<T[P]>, M>
        & Component.ExternalId<T, P>
        & Component.Local
        & Component.Primitive<Component.Primitive.ValueTypeOf<T[P]>>
        & Component.Property<K, Component.Property.ValueOf<T[P]>, M>;

    export module Id {
        export type Keys<T> = Exclude<{ [P in keyof T]: T[P] extends Id<any, any, any> | undefined ? P : never }[keyof T], undefined>;

        export type Computed<
            K extends string,
            T extends Type<string>,
            P extends Component.Modifier.Unique.Keys<T>,
            U,
            I extends Component.Local.Keys<U> & string,
            M extends "n" = never>
            = Component.Computed<U, I, Component.Primitive.ValueTypeOf<T[P]>, M>
            & Component.ExternalId<T, P>
            & Component.Local
            & Component.Primitive<Component.Primitive.ValueTypeOf<T[P]>>
            & Component.Property<K, Component.Property.ValueOf<T[P]>, M>;
        // & Component.Property<K, ReturnType<Component.Primitive.ValueTypeOf<T[P]>>, M>;

        export type Ethereal<
            K extends string,
            T extends Type<string>,
            P extends Component.Modifier.Unique.Keys<T>,
            M extends "n" = never>
            = Component.Ethereal
            & Component.ExternalId<T, P>
            & Component.Local
            & Component.Primitive<Component.Primitive.ValueTypeOf<T[P]>>
            & Component.Property<K, Component.Property.ValueOf<T[P]>, M>;
    }
}
