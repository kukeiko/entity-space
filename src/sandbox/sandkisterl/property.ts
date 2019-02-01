export type Unbox<T> = T extends any[] ? T[number] : T;
export type Box<T, A = any[]> = A extends any[] ? T[] : T;
export type NullIfNull<T, U> = U extends null ? T | null : T;

/***
 *    ████████╗██╗   ██╗██████╗ ███████╗
 *    ╚══██╔══╝╚██╗ ██╔╝██╔══██╗██╔════╝
 *       ██║    ╚████╔╝ ██████╔╝█████╗
 *       ██║     ╚██╔╝  ██╔═══╝ ██╔══╝
 *       ██║      ██║   ██║     ███████╗
 *       ╚═╝      ╚═╝   ╚═╝     ╚══════╝
 */
export interface Type<K extends string> {
    $: Type.Metadata<K>;
}

export module Type {
    export interface Metadata<K extends string> {
        key: K;
    }
}

let a = {};
let b = {};


/***
 *     ██████╗ ██████╗ ███╗   ███╗██████╗  ██████╗ ███╗   ██╗███████╗███╗   ██╗████████╗
 *    ██╔════╝██╔═══██╗████╗ ████║██╔══██╗██╔═══██╗████╗  ██║██╔════╝████╗  ██║╚══██╔══╝
 *    ██║     ██║   ██║██╔████╔██║██████╔╝██║   ██║██╔██╗ ██║█████╗  ██╔██╗ ██║   ██║
 *    ██║     ██║   ██║██║╚██╔╝██║██╔═══╝ ██║   ██║██║╚██╗██║██╔══╝  ██║╚██╗██║   ██║
 *    ╚██████╗╚██████╔╝██║ ╚═╝ ██║██║     ╚██████╔╝██║ ╚████║███████╗██║ ╚████║   ██║
 *     ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚═╝      ╚═════╝ ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═══╝   ╚═╝
 */
// [note] not to be used by user
export module Component {
    export type Array = {
        array: true;
    };

    // [note] current idea: ignore date @ filtering, use same filtering functionality
    // as string
    export type Clonable<T> = {
        clonable: true;
        factory: (value: T) => T;
    };

    type Foo = Clonable<boolean>;
    type Bar = StringConstructor extends Foo["factory"] ? true : false;
    type Baz = NumberConstructor extends Foo["factory"] ? true : false;
    type Khaz = DateConstructor extends Foo["factory"] ? true : false;
    type Mo = BooleanConstructor extends Foo["factory"] ? true : false;


    export type Complex = {
        complex: true;
    };
    // } & Local;

    export type Composited<T, V> = {
        composited: true;
        compositeValue: (source: T) => V;
    };

    export type Computed = {
        computed: true;
    };

    export type Creatable = {
        creatable: true;
    };
    // } & Local;

    export type Dto<A extends string, D> = {
        dtoKey: A;
        readDto<U extends Record<A, D>>(dtoInstance: U): D;
        writeDto<U extends Record<A, D>>(dtoInstance: U, value: D): void;
    };

    export module Dto {
        export type Aliases<T> = Aliases.Optional<T> | Aliases.Required<T>;

        export module Aliases {
            export type Optional<T> = Exclude<{ [P in keyof T]: undefined extends T[P] ? (T[P] extends Dto<infer A, any> | undefined ? A : never) : never }[keyof T], undefined>;
            export type Required<T> = Exclude<{ [P in keyof T]: T[P] extends Dto<infer A, any> ? A : never }[keyof T], undefined>;
        }

        export type ValueOf<T> = T extends Dto<any, infer D> ? D : never;

        export type WithAlias<T, A extends string> = WithAlias.Optional<T, A> | WithAlias.Required<T, A>;

        export module WithAlias {
            export type Optional<T, A extends string> = Exclude<{ [P in keyof T]: T[P] extends Dto<A, any> | undefined ? T[P] : never }[keyof T], undefined>;
            export type Required<T, A extends string> = Exclude<{ [P in keyof T]: T[P] extends Dto<A, any> ? T[P] : never }[keyof T], undefined>;
        }
    }

    // [note] i think we can drop the "step" thingy @ filter
    export type Filterable = {
        filterable: true;
    };

    export module Filterable {
        export type Type = "boolean" | "number" | "string";
    }

    export type Id = {
        id: true;
    };
    // } & Unique;

    // [note] i imagine this to be used for the system-id use case; "Ethereal" as name was chosen because i love it,
    // and there is a somewhat technically plausible reason for it (as per definition from wiktionary.com):
    // "Pertaining to the hypothetical upper, purer air, or to the higher regions beyond the earth or beyond the atmosphere; celestial; otherworldly."
    // => system A is otherworldly to system B and vice versa; they are out of each others' reach.
    // since it therefore can't be inferred from a dto, it has to be supplied to the thing that creates instances from dtos
    export type Ethereal = {
        ethereal: true;
    };

    // export type External<T> = {
    export type External = {
        external: true;
    };
    // } & Navigable<T>;

    export type Local = {
        local: true;
    };

    export module Local {
        export type Keys<T> = Exclude<{ [P in keyof T]: T[P] extends Local | undefined ? P : never }[keyof T], undefined>;
    }

    export type Navigable<T extends Type<string>> = {
        navigable: true;
        navigated: T;
    };

    export module Navigable {
        export type Keys<T> = Exclude<{ [P in keyof T]: T[P] extends Navigable<any> | undefined ? P : never }[keyof T], undefined>;
        export type OtherType<N> = N extends Navigable<infer T> ? T : never;
    }

    export type Nullable = {
        nullable: true;
    };

    export type Ordered = {
        ordered: true;
    };

    export type Property<K extends string, V> = {
        key: K;
        read<U extends Record<K, V>>(instance: U): V;
        write<U extends Record<K, V>>(instance: U, value: V): void;
    };

    export module Property {
        // export type Keys<T> = Keys.Optional<T> | Keys.Required<T>;
        export type Keys<T> = (Keys.Optional<T> | Keys.Required<T>) & keyof T;

        export module Keys {
            export type Optional<T> = Exclude<{ [P in keyof T]: undefined extends T[P] ? (T[P] extends Property<infer K, any> | undefined ? K : never) : never }[keyof T], undefined>;
            export type Required<T> = Exclude<{ [P in keyof T]: T[P] extends Property<infer K, any> ? K : never }[keyof T], undefined>;
        }

        export type ValueOf<T> = T extends Property<any, infer V> ? V : never;

        export type WithKey<T, K extends string> = WithKey.Optional<T, K> | WithKey.Required<T, K>;

        export module WithKey {
            export type Optional<T, K extends string> = Exclude<{ [P in keyof T]: T[P] extends Property<K, any> | undefined ? T[P] : never }[keyof T], undefined>;
            export type Required<T, K extends string> = Exclude<{ [P in keyof T]: T[P] extends Property<K, any> ? T[P] : never }[keyof T], undefined>;
        }
    }

    export type Patchable = {
        patchable: true;
    };
    // } & Creatable;

    export type Simple = {
        simple: true;
    };

    export type Unique = {
        unique: true;
    };
    // } & Local;

    export module Unique {
        export type Keys<T> = Exclude<{ [P in keyof T]: T[P] extends Unique | undefined ? P : never }[keyof T], undefined>;
    }

    export type Virtual = {
        virtual: true;
    };
}


/***
 *    ██╗███╗   ██╗███████╗████████╗ █████╗ ███╗   ██╗ ██████╗███████╗
 *    ██║████╗  ██║██╔════╝╚══██╔══╝██╔══██╗████╗  ██║██╔════╝██╔════╝
 *    ██║██╔██╗ ██║███████╗   ██║   ███████║██╔██╗ ██║██║     █████╗
 *    ██║██║╚██╗██║╚════██║   ██║   ██╔══██║██║╚██╗██║██║     ██╔══╝
 *    ██║██║ ╚████║███████║   ██║   ██║  ██║██║ ╚████║╚██████╗███████╗
 *    ╚═╝╚═╝  ╚═══╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝╚══════╝
 */
// export type Instance<T> = Instance.Optional<T> & Instance.Required<T>;
export type Instance<T> = NullIfNull<Box<Instance.Optional<Exclude<Unbox<T>, null>>, T> & Box<Instance.Required<Exclude<Unbox<T>, null>>, T>, T>;

export module Instance {
    // [note] not to be used by user
    export type Optional<T> = { [K in Component.Property.Keys.Optional<T>]?: Component.Property.ValueOf<Component.Property.WithKey<T, K>> };
    // [note] not to be used by user
    export type Required<T> = { [K in Component.Property.Keys.Required<T>]: Component.Property.ValueOf<Component.Property.WithKey<T, K>> };

    // export type Dto<T> = Dto.Optional<T> & Dto.Required<T>;
    export type Dto<T> = NullIfNull<Box<Dto.Optional<Exclude<Unbox<T>, null>>, T> & Box<Dto.Required<Exclude<Unbox<T>, null>>, T>, T>;

    export module Dto {
        // [note] not to be used by user
        export type Optional<T> = { [K in Component.Dto.Aliases.Optional<T>]?: Component.Dto.ValueOf<Component.Dto.WithAlias<T, K>>; };
        // [note] not to be used by user
        export type Required<T> = { [K in Component.Dto.Aliases.Required<T>]: Component.Dto.ValueOf<Component.Dto.WithAlias<T, K>>; };
    }
}


/***
 *    ██╗██████╗
 *    ██║██╔══██╗
 *    ██║██║  ██║
 *    ██║██║  ██║
 *    ██║██████╔╝
 *    ╚═╝╚═════╝
 */
export type Id<K extends string, V, A extends string = K, D = V>
    = Component.Dto<A, D>
    & Component.Id
    & Component.Local
    & Component.Property<K, V>
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
    C extends Simple.Cloner | null,
    A extends string = K,
    D = NullIfNull<ReturnType<Exclude<C, null>>, C>> = {
        clone: Exclude<C, null>;
    }
    & Component.Dto<A, D>
    & Component.Property<K, NullIfNull<ReturnType<Exclude<C, null>>, C>>;

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
    T extends Type<string> | null,
    P extends Reference.Id<any, T, any>,
    A extends string = K> = {
        localKey: P;
    }
    & Component.Dto<A, Instance.Dto<T>>
    & Component.External
    & Component.Property<K, Instance<T>>
    & Component.Navigable<Exclude<T, null>>
    & (T extends null ? Component.Nullable : {});

export module Reference {
    export type Keys<T> = Exclude<{ [P in keyof T]: T[P] extends Reference<any, any, any> | undefined ? P : never }[keyof T], undefined>;

    export type Id<
        K extends string,
        T extends Type<string> | null,
        P extends Component.Unique.Keys<Exclude<T, null>>,
        A extends string = K>
        = {
            otherKey: Exclude<T, null>[P];
        }
        & Component.Local
        & Component.Property<K, NullIfNull<Component.Property.ValueOf<Exclude<T, null>[P]>, T>>
        & Component.Dto<A, NullIfNull<Component.Dto.ValueOf<Exclude<T, null>[P]>, T>>
        & (T extends null ? Component.Nullable : {})
        ;

    export module Id {
        export type Creatable<
            K extends string,
            T extends Type<string> | null,
            P extends Component.Unique.Keys<Exclude<T, null>>,
            A extends string = K>
            = Id<K, T, P, A> & Component.Creatable;

        export type Patchable<
            K extends string,
            T extends Type<string> | null,
            P extends Component.Unique.Keys<Exclude<T, null>>,
            A extends string = K>
            = Creatable<K, T, P, A> & Component.Patchable;
    }

    export module Id {
        export type Keys<T> = Exclude<{ [P in keyof T]: T[P] extends Id<any, any, any> | undefined ? P : never }[keyof T], undefined>;
    }

    export type Virtual = {};

    // export type Id<
    //     K extends string,
    //     T extends (Type<string> | null) | Type<string>[],
    //     P extends Component.Unique.Keys<U>,
    //     A extends string = K,
    //     U = T extends Type<string>[] ? T[number] : Exclude<T, null>,
    //     D = Component.Dto.ValueOf<U[P]>,
    //     V = Component.Property.ValueOf<U[P]>>
    //     = {
    //         otherKey: U[P];
    //     }
    //     & Component.Local
    //     & (
    //         any[] extends T
    //         ? null extends T ? Component.Property<K, V[] | null> : Component.Property<K, V[]>
    //         : null extends T ? Component.Property<K, V | null> : Component.Property<K, V>
    //     )
    //     & (
    //         any[] extends T
    //         ? null extends T ? Component.Dto<A, D[] | null> : Component.Dto<A, D[]>
    //         : null extends T ? Component.Dto<A, D | null> : Component.Dto<A, D>
    //     )
    //     & (T extends null ? Component.Nullable : {})
    //     & (T extends any[] ? Component.Array : {})
    //     ;
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
export type Children = {

};

// [missing]: Complex, Simple, Struct

/***
 *    ████████╗██╗   ██╗██████╗ ███████╗    ███╗   ███╗ █████╗ ██████╗ ██████╗ ███████╗██████╗
 *    ╚══██╔══╝╚██╗ ██╔╝██╔══██╗██╔════╝    ████╗ ████║██╔══██╗██╔══██╗██╔══██╗██╔════╝██╔══██╗
 *       ██║    ╚████╔╝ ██████╔╝█████╗█████╗██╔████╔██║███████║██████╔╝██████╔╝█████╗  ██████╔╝
 *       ██║     ╚██╔╝  ██╔═══╝ ██╔══╝╚════╝██║╚██╔╝██║██╔══██║██╔═══╝ ██╔═══╝ ██╔══╝  ██╔══██╗
 *       ██║      ██║   ██║     ███████╗    ██║ ╚═╝ ██║██║  ██║██║     ██║     ███████╗██║  ██║
 *       ╚═╝      ╚═╝   ╚═╝     ╚══════╝    ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝     ╚══════╝╚═╝  ╚═╝
 */
export class TypeMapper<T extends Type<string>, M = { $: T["$"] }> {
    // selectAll(): TypeBuilder<T, SelectedLocals<T> & D> {
    //     return this as any;
    // }

    // selectAll(): TypeMapper<T, Local.All<T> & M> {
    //     return this as any;
    // }

    select<K extends Component.Local.Keys<T>, S = Exclude<T[K], undefined>>(k: K): TypeMapper<T, Record<K, S> & M> {
        return this as any;
    }

    // select<K extends Local.Keys<T>, S = Exclude<T[K], undefined>>(k: K): TypeMapper<T, Record<K, S> & M> {
    //     return this as any;
    // }

    // selectIf<K extends Local.Keys<T>, S = T[K] | undefined>(k: K, flag: boolean): TypeMapper<T, Record<K, S> & M> {
    //     return this as any;
    // }

    // [todo] stopped here - expand needs to return a navigable property, not the navigated type itself
    // expand<K extends Component.Navigable.Keys<T>, E extends Type<string> = Component.Navigable.OtherType<T[K]>, O = {}>(k: K, _: (eq: TypeMapper<E>) => TypeMapper<E, O>): TypeMapper<T, Record<K, O> & M> {
    expand<K extends Component.Navigable.Keys<T>, E extends Type<string> = Component.Navigable.OtherType<T[K]>, O = {}>(k: K, _: (eq: TypeMapper<E>) => TypeMapper<E, O>): TypeMapper<T, Record<K, O> & M> {
        return this as any;
    }

    expandIf<K extends Component.Navigable.Keys<T>, E extends Type<string> = Component.Navigable.OtherType<T[K]>, O = {}>(k: K, flag: boolean, _: (eq: TypeMapper<E>) => TypeMapper<E, O>): TypeMapper<T, Record<K, O | undefined> & M> {
        return this as any;
    }

    // expand<K extends Navigable.Keys<T> & string, E = Navigable.OtherType<T[K]>, O = {}>(k: K, _: (eq: TypeMapper<E>) => TypeMapper<E, O>): TypeMapper<T, Record<K, Navigable<O, Box<Instance<O>, Property.ValueType<T[K]>>, K>> & M> {
    //     return this as any;
    // }

    // expandIf<K extends Navigable.Keys<T> & string, E = Navigable.OtherType<T[K]>, O = {}>(k: K, flag: boolean, _: (eq: TypeMapper<E>) => TypeMapper<E, O>): TypeMapper<T, Record<K, undefined | Navigable<O, Box<Instance<O>, Property.ValueType<T[K]>>, K>> & M> {
    //     return this as any;
    // }

    get(): M {
        return null as any;
    }
}

/***
 *    ██████╗  ██████╗ ███╗   ███╗ █████╗ ██╗███╗   ██╗
 *    ██╔══██╗██╔═══██╗████╗ ████║██╔══██╗██║████╗  ██║
 *    ██║  ██║██║   ██║██╔████╔██║███████║██║██╔██╗ ██║
 *    ██║  ██║██║   ██║██║╚██╔╝██║██╔══██║██║██║╚██╗██║
 *    ██████╔╝╚██████╔╝██║ ╚═╝ ██║██║  ██║██║██║ ╚████║
 *    ╚═════╝  ╚═════╝ ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝
 */
export module Domain {
    export type TypeConstructionOptions<$T extends Type<$K>, $K extends string> =
        {
            $: {
                key: $K;
            }
        } & {
            [$P in Component.Property.Keys<$T>]?
            : $T[$P] extends Reference<infer K, infer T, infer P, infer A> ? PropertyOptions.Reference<K, P, A>
            : never;
        };

    export module PropertyOptions {
        export type Reference<
            K extends string,
            P extends Component.Property<any, any>,
            A extends string> = {
                localKey: P["key"];
                type: "reference";
            } & (A extends K ? {} : { dtoKey: A; });
    }
}


type ArtistTypeConstructionOptions = Domain.TypeConstructionOptions<ArtistType, "artist">;
type Muzi = ArtistType["country"] extends Reference<infer K, infer T, infer P, infer A> ? true : false;

let artistTypeConstructionOptions: ArtistTypeConstructionOptions = {
    $: {
        key: "artist"
    },
    country: {
        dtoKey: "Country",
        localKey: "countryId",
        type: "reference"
    }
};


export interface UserType extends Type<"user"> {
    id: Id<"id", number>;
    name: Simple<"name", typeof String | null>;
}

export interface CountryType extends Type<"country"> {
    id: Id<"id", string>;
}

export interface ArtistType extends Type<"artist"> {
    id: Id<"id", number, "Id">;
    createdAt: Simple<"createdAt", typeof Date, "CreatedAt", number>;
    createdById: Reference.Id<"createdById", UserType, "id", "CreatedById">;
    createdBy: Reference<"createdBy", UserType, ArtistType["createdById"], "CreatedBy">;
    changedAt: Simple<"changedAt", typeof Date | null, "ChangedAt">;
    parentId: Reference.Id.Creatable<"parentId", ArtistType | null, "id", "ParentId">;
    parent: Reference<"parent", ArtistType | null, ArtistType["parentId"], "Parent">;
    // children: Child<"children", ArtistType, "parent">;
    // albums: Child<"albums", AlbumType[], "artist">;
    countryId: Reference.Id.Creatable<"countryId", CountryType | null, "id", "CountryId">;
    country: Reference<"country", CountryType | null, ArtistType["countryId"], "Country">;
    lalala: 3;
    // reviewIds: Reference.Id<"reviewIds", ReviewType[] | null, "id", "ReviewIds">;
    // reviews: Reference<"reviews", (ReviewType | null)[] | null>;
}

type ArtistPropertyKeys = Component.Property.Keys<ArtistType>;
type ArtistPropertyOptionalKeys = Component.Property.Keys.Optional<ArtistType>;
type ArtistDtoAliases = Component.Dto.Aliases<ArtistType>;
type ArtistLocalKeys = Component.Local.Keys<ArtistType>;
type ArtistParentValueType = Component.Property.ValueOf<ArtistType["parent"]>;
type ArtistIdViaAlias = Component.Dto.WithAlias<ArtistType, "Id">;
type ArtistInstance = Instance<ArtistType>;
type ArtistDtoInstance = Instance.Dto<ArtistType>;

type Bar = Component.Dto.ValueOf<ArtistType["parentId"]>;
// type Baz = Component.Property.ValueOf<ArtistType["reviewIds"]>;
type Foo = ArtistType["$"]["key"];

export interface AlbumType extends Type<"album"> {
    id: Id<"id", number, "Id">;
    artistId: Reference.Id<"artistId", ArtistType, "id">;
    artist: Reference<"artist", ArtistType, AlbumType["artistId"], "Artist">;
    createdById: Reference.Id<"createdById", UserType, "id", "CreatedById">;
    createdBy: Reference<"createdBy", UserType, AlbumType["createdById"], "CreatedBy">;
}

export interface ReviewType extends Type<"review"> {
    id: Id<"id", number>;
}


let builtArtist: ArtistType = {
    lalala: 3,
    $: {
        key: "artist"
    },
    id: null as any,
    // albums: {
    //     parentReference: null as any as AlbumType["artist"],
    //     navigable: true,
    //     navigated: null as any as AlbumType
    // },
    changedAt: {
        dtoKey: "ChangedAt",
        key: "changedAt",
        clone: Date,
        read: x => x.changedAt,
        readDto: x => x.ChangedAt,
        write: (x, v) => x.changedAt = v,
        writeDto: (x, v) => x.ChangedAt = v
    },
    // children: {
    //     parentReference: null as any as ArtistType["parent"],
    //     navigable: true,
    //     navigated: null as any as ArtistType
    // },
    country: {
        dtoKey: "Country",
        external: true,
        key: "country",
        localKey: null as any as ArtistType["countryId"],
        navigable: true,
        navigated: null as any as CountryType,
        nullable: true,
        read: x => x.country,
        readDto: x => x.Country,
        write: (x, v) => x.country = v,
        writeDto: (x, v) => x.Country = v
    },
    countryId: {
        creatable: true,
        dtoKey: "CountryId",
        key: "countryId",
        local: true,
        nullable: true,
        otherKey: null as any as CountryType["id"],
        read: x => x.countryId,
        readDto: x => x.CountryId,
        write: (x, v) => x.countryId = v,
        writeDto: (x, v) => x.CountryId = v
    },
    createdAt: {
        dtoKey: "CreatedAt",
        key: "createdAt",
        clone: Date,
        read: x => x.createdAt,
        readDto: x => x.CreatedAt,
        write: (x, v) => x.createdAt = v,
        writeDto: (x, v) => x.CreatedAt = v
    },
    createdBy: {
        dtoKey: "CreatedBy",
        external: true,
        key: "createdBy",
        localKey: null as any as ArtistType["createdById"],
        navigable: true,
        navigated: null as any as UserType,
        read: x => x.createdBy,
        readDto: x => x.CreatedBy,
        write: (x, v) => x.createdBy = v,
        writeDto: (x, v) => x.CreatedBy = v
    },
    createdById: null as any,
    parentId: {
        creatable: true,
        dtoKey: "ParentId",
        key: "parentId",
        local: true,
        nullable: true,
        otherKey: null as any as ArtistType["id"],
        readDto: x => x.ParentId,
        writeDto: (u, v) => u.ParentId = v,
        read: x => x.parentId,
        write: (x, v) => x.parentId = v,
    },
    parent: {
        dtoKey: "Parent",
        key: "parent",
        localKey: null as any as ArtistType["parentId"],
        external: true,
        navigable: true,
        navigated: null as any as ArtistType,
        nullable: true,
        readDto: x => x.Parent,
        writeDto: (u, v) => u.Parent = v,
        read: x => x.parent,
        write: (x, v) => x.parent = v,
    },
    // reviewIds: {
    //     array: true,
    //     dtoKey: "ReviewIds",
    //     local: true,
    //     key: "reviewIds",
    //     nullable: true,
    //     otherKey: null as any as ReviewType["id"],
    //     read: x => x.reviewIds,
    //     readDto: x => x.ReviewIds,
    //     write: (x, v) => x.reviewIds = v,
    //     writeDto: (x, v) => x.ReviewIds = v,
    // }
    // reviews: {
    //     array: true,
    //     dtoKey: "reviews",
    //     external: true,
    //     key: "reviews",
    //     navigable: true,
    //     navigated: null as any as ReviewType,
    //     read: x => x.
    // }
};


let artistInstances: Instance<ArtistType[]> = [
    {
        changedAt: "2019-01-30T21:06:50.514Z",
        country: {
            id: "at",
        },
        countryId: "at",
        createdAt: "2017-06-30",
        createdBy: null as any as Instance<UserType>,
        createdById: 1,
        id: 2,
        parentId: null,
        parent: {
            createdAt: "2019-01-01",
            changedAt: null,
            country: null,
            countryId: null,
            createdBy: null as any as Instance<UserType>,
            createdById: 123,
            id: 987,
            parent: null,
            parentId: null,
            // reviewIds: [98, 123]
        },
        // reviewIds: []
    }
];

let artistDtoInstances: Instance.Dto<ArtistType[]> = [
    {
        ChangedAt: null,
        Country: {
            id: "at"
        },
        CountryId: "at",
        CreatedAt: 123,
        CreatedBy: null as any as Instance.Dto<UserType>,
        CreatedById: 1,
        Id: 2,
        ParentId: null,
        Parent: {
            Country: null,
            CountryId: null,
            ChangedAt: null,
            CreatedAt: 56,
            CreatedBy: null as any as Instance.Dto<UserType>,
            CreatedById: 1,
            Id: 2,
            Parent: null,
            // ReviewIds: [1, 2, 3],
            ParentId: null
        },
        // ReviewIds: []
    }
];


let artistMapper = new TypeMapper<ArtistType>()
    .select("id")
    .expand("country", q => q.select("id"))
    .expandIf("createdBy", true, q => q)
    ;


let builtMappedArtist = artistMapper.get();
builtMappedArtist.country.id;

type Zuzl = Component.Property.Keys<typeof builtMappedArtist>;
type Zazl = (typeof builtMappedArtist)["country"] extends Component.Property<infer A, infer B> ? true : false;

let builtMappedArtistInstance: Instance<typeof builtMappedArtist> = {
    id: 3
};
