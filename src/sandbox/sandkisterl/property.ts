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

    export type Expanded<T extends Type<string>> = {
        expanded: T;
        // navigated: Partial<T>;
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
        // navigated: Partial<T>;
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
        export type Keys<T> = Keys.Optional<T> | Keys.Required<T>;
        // export type Keys<T> = (Keys.Optional<T> | Keys.Required<T>) & keyof T;

        export module Keys {
            export type Optional<T> = Exclude<{ [P in keyof T]: undefined extends T[P] ? (T[P] extends Property<infer K, any> | undefined ? K : never) : never }[keyof T], undefined> & keyof T;
            export type Required<T> = Exclude<{ [P in keyof T]: T[P] extends Property<infer K, any> ? K : never }[keyof T], undefined> & keyof T;
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
export type Instance<T> = NullIfNull<Box<Instance.Optional<Exclude<Unbox<T>, null>>, T> & Box<Instance.Required<Exclude<Unbox<T>, null>>, T>, T>;

export module Instance {
    // [todo] figure out if "T[K] is in any way faster than "Component.Property.WithKey<T, K>"
    export type Optional<T> = {
        [K in Component.Property.Keys.Optional<T>]?
        : T[K] extends (Component.Expanded<infer E> & Component.Nullable) | undefined ? Instance<E> | null
        : T[K] extends Component.Expanded<infer E> | undefined ? Instance<E>
        // [todo] not sure i need that additional "undefined extends T[K]" check
        : T[K] extends (Component.Property<K, infer V> | undefined) ? undefined extends T[K] ? undefined | V : V
        : never
    };

    export type Required<T> = {
        [K in Component.Property.Keys.Required<T>]
        : T[K] extends (Component.Expanded<infer E> & Component.Nullable) ? Instance<E> | null
        : T[K] extends Component.Expanded<infer E> ? Instance<E>
        : T[K] extends Component.Property<K, infer V> ? V
        : never
    };
    // export type Optional<T> = {
    //     [K in Component.Property.Keys.Optional<T>]?
    //     : Component.Property.WithKey<T, K> extends (Component.Expanded<infer E> & Component.Nullable) | undefined ? Instance<E> | null
    //     : Component.Property.WithKey<T, K> extends Component.Expanded<infer E> | undefined ? Instance<E>
    //     : Component.Property.WithKey<T, K> extends (Component.Property<K, infer V> | undefined) ? undefined extends T[K] ? undefined | V : V
    //     : never
    // };

    // export type Required<T> = {
    //     [K in Component.Property.Keys.Required<T>]
    //     : Component.Property.WithKey<T, K> extends (Component.Expanded<infer E> & Component.Nullable) ? Instance<E> | null
    //     : Component.Property.WithKey<T, K> extends Component.Expanded<infer E> ? Instance<E>
    //     : Component.Property.WithKey<T, K> extends Component.Property<K, infer V> ? V
    //     : never
    // };

    export type Dto<T> = NullIfNull<Box<Dto.Optional<Exclude<Unbox<T>, null>>, T> & Box<Dto.Required<Exclude<Unbox<T>, null>>, T>, T>;

    export module Dto {
        export type Optional<T> = {
            [A in Component.Dto.Aliases.Optional<T>]?
            : Component.Dto.WithAlias<T, A> extends (Component.Expanded<infer E> & Component.Nullable) | undefined ? Instance.Dto<E> | null
            : Component.Dto.WithAlias<T, A> extends Component.Expanded<infer E> | undefined ? Instance<E>
            // [todo] not sure i need that additional "undefined extends Component.Dto.WithAlias<T, A>" check
            : Component.Dto.WithAlias<T, A> extends (Component.Dto<A, infer D> | undefined) ? undefined extends Component.Dto.WithAlias<T, A> ? undefined | D : D
            : never
        };

        export type Required<T> = {
            [A in Component.Dto.Aliases.Required<T>]
            : Component.Dto.WithAlias<T, A> extends (Component.Expanded<infer E> & Component.Nullable) ? Instance.Dto<E> | null
            : Component.Dto.WithAlias<T, A> extends Component.Expanded<infer E> ? Instance.Dto<E>
            : Component.Dto.WithAlias<T, A> extends (Component.Dto<A, infer D>) ? D
            : never
        };
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
    & Component.Local
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
    // & Component.Dto<A, Partial<Instance.Dto<T>>>
    & Component.External
    // & Component.Property<K, Instance<T> | undefined>
    // [note] as of now i think it makes the most sense that the value of a reference is partial by default,
    // since it can't know which parts of navigated type have been selected/expanded
    // & Component.Property<K, Partial<Instance<T>>>
    & Component.Property<K, Instance<T>>
    & Component.Navigable<Exclude<T, null>>
    // & (T extends null ? Component.Nullable : {});
    & (null extends T ? Component.Nullable : {});

export module Reference {
    // export type Mapped<R> = R extends Reference<infer K, infer T, infer P, infer A> ? Reference<K, T, P, A> : never;

    // export type Keys<T> = Exclude<{ [P in keyof T]: T[P] extends Reference<any, any, any> | undefined ? P : never }[keyof T], undefined>;
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

/***
 *    ████████╗██╗   ██╗██████╗ ███████╗    ███╗   ███╗ █████╗ ██████╗ ██████╗ ███████╗██████╗
 *    ╚══██╔══╝╚██╗ ██╔╝██╔══██╗██╔════╝    ████╗ ████║██╔══██╗██╔══██╗██╔══██╗██╔════╝██╔══██╗
 *       ██║    ╚████╔╝ ██████╔╝█████╗█████╗██╔████╔██║███████║██████╔╝██████╔╝█████╗  ██████╔╝
 *       ██║     ╚██╔╝  ██╔═══╝ ██╔══╝╚════╝██║╚██╔╝██║██╔══██║██╔═══╝ ██╔═══╝ ██╔══╝  ██╔══██╗
 *       ██║      ██║   ██║     ███████╗    ██║ ╚═╝ ██║██║  ██║██║     ██║     ███████╗██║  ██║
 *       ╚═╝      ╚═╝   ╚═╝     ╚══════╝    ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝     ╚══════╝╚═╝  ╚═╝
 */
export class TypeMapper<T extends Type<string>, M = { $: T["$"] }> {
    // export class TypeMapper<T extends Type<string>, M = Partial<T> & { $: T["$"] }> {
    // selectAll(): TypeBuilder<T, SelectedLocals<T> & D> {
    //     return this as any;
    // }

    // selectAll(): TypeMapper<T, Local.All<T> & M> {
    //     return this as any;
    // }

    select<K extends Component.Local.Keys<T>, S = Exclude<T[K], undefined>>(k: K): TypeMapper<T, Record<K, S> & M> {
        return this as any;
    }

    selectIf<K extends Component.Local.Keys<T>, S = Exclude<T[K], undefined>>(k: K, flag: boolean): TypeMapper<T, Record<K, S | undefined> & M> {
        return this as any;
    }

    // Pick<T, Exclude<keyof T, K>>
    expand<
        K extends Component.Navigable.Keys<T> & string,
        E extends Type<string> = Component.Navigable.OtherType<T[K]>,
        O extends Type<string> = E
    >(k: K, _: (eq: TypeMapper<E>) => TypeMapper<E, O>):
        TypeMapper<T, Record<K, T[K] & Component.Expanded<O>> & M> {
        return this as any;
    }

    expandIf<
        K extends Component.Navigable.Keys<T> & string,
        E extends Type<string> = Component.Navigable.OtherType<T[K]>,
        O extends Type<string> = E
    >(k: K, flag: boolean, _: (eq: TypeMapper<E>) => TypeMapper<E, O>):
        TypeMapper<T, Record<K, undefined | (T[K] & Component.Expanded<O>)> & M> {
        return this as any;
    }

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

    createdById: Reference.Id<"createdById", UserType | null, "id", "CreatedById">;
    createdBy: Reference<"createdBy", UserType | null, UserType["createdById"], "CreatedBy">;

    changedAt: Simple<"changedAt", typeof Date | null, "ChangedAt">;
    changedById: Reference.Id<"changedById", UserType | null, "id", "ChangedById">;
    changedBy: Reference<"changedBy", UserType | null, UserType["changedById"], "ChangedBy">;
}

export interface CountryType extends Type<"country"> {
    id: Id<"id", string>;
    name: Simple<"name", typeof String>;

    createdById: Reference.Id<"createdById", UserType, "id", "CreatedById">;
    createdBy: Reference<"createdBy", UserType, CountryType["createdById"], "CreatedBy">;

    changedAt: Simple<"changedAt", typeof Date | null, "ChangedAt">;
    changedById: Reference.Id<"changedById", UserType | null, "id", "ChangedById">;
    changedBy: Reference<"changedBy", UserType | null, CountryType["changedById"], "ChangedBy">;
}

export interface ArtistType extends Type<"artist"> {
    id: Id<"id", number, "Id">;

    createdAt: Simple<"createdAt", typeof Date, "CreatedAt", number>;
    createdById: Reference.Id<"createdById", UserType, "id", "CreatedById">;
    createdBy: Reference<"createdBy", UserType, ArtistType["createdById"], "CreatedBy">;

    changedAt: Simple<"changedAt", typeof Date | null, "ChangedAt">;
    changedById: Reference.Id<"changedById", UserType | null, "id", "ChangedById">;
    changedBy: Reference<"changedBy", UserType | null, ArtistType["changedById"], "ChangedBy">;

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
type ArtistCountryValue = Component.Property.ValueOf<Component.Property.WithKey<ArtistType, "country">>;


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
        local: true,
        clone: Date,
        read: x => x.changedAt,
        readDto: x => x.ChangedAt,
        write: (x, v) => x.changedAt = v,
        writeDto: (x, v) => x.ChangedAt = v
    },
    changedBy: {
        dtoKey: "ChangedBy",
        external: true,
        key: "changedBy",
        localKey: null as any as ArtistType["changedById"],
        navigable: true,
        navigated: null as any as UserType,
        nullable: true,
        read: x => x.changedBy,
        readDto: x => x.ChangedBy,
        write: (x, v) => x.changedBy = v,
        writeDto: (x, v) => x.ChangedBy = v
    },
    changedById: {
        dtoKey: "ChangedById",
        key: "changedById",
        local: true,
        nullable: true,
        otherKey: null as any as UserType["id"],
        read: x => x.changedById,
        readDto: x => x.ChangedById,
        write: (x, v) => x.changedById = v,
        writeDto: (x, v) => x.ChangedById = v
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
        local: true,
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
    }
};

let artistDtoInstances: Instance.Dto<ArtistType[]> = [
    {
        ChangedAt: null,
        // Country: null,
        Country: {
            ChangedAt: "foo",
            ChangedBy: {
                ChangedAt: null,
                ChangedBy: null,
                ChangedById: 3,
                CreatedBy: null,
                CreatedById: 123,
                id: 3,
                name: "foo"
            },
            ChangedById: 123,
            CreatedBy: {
                ChangedAt: null,
                ChangedBy: null,
                ChangedById: null,
                CreatedBy: null,
                CreatedById: 3,
                id: 3,
                name: "foo"
            },
            CreatedById: 1,
            id: "at",
            name: "Austria"
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
            ParentId: null,
            ChangedBy: null,
            ChangedById: null
        },
        ChangedBy: null,
        ChangedById: null
        // ReviewIds: []
    }
];

let artistMapper = new TypeMapper<ArtistType>()
    .selectIf("id", true)
    .expand("createdBy", q => q.select("id"))
    .expand("country", q => q
        .expand("createdBy", q => q.select("name"))
    )
    .expand("country", q => q
        .expand("changedBy", q => q.select("id"))
        .expand("createdBy", q => q.select("id"))
    )
    .expand("country", q => q
        .expand("changedBy", q => q.select("name"))
    )
    .expand("country", q => q.select("createdById").select("id").select("name"))
    .expand("createdBy", q => q.select("id").select("name"))
    .expand("parent", q => q.expand("country", q => q.select("createdById").select("id").select("name").expand("createdBy", q => q.select("id").select("name"))))
    .expand("country", q => q.select("name"))
    .expand("country", q => q.select("id").select("createdById"))
    .expand("country", q => q.expand("createdBy", q => q))
    .expand("country", q => q.expand("createdBy", q => q.select("id")))
    .expand("country", q => q.expand("createdBy", q => q.select("name")))
    .expandIf("changedBy", true, q => q.expandIf("createdBy", true, q => q.select("name")))
    ;

let builtMappedArtist = artistMapper.get();
let builtMappedArtistInstance: Instance<typeof builtMappedArtist> = {
    createdBy: {
        id: 1,
        name: null
    },
    country: {
        createdById: 1,
        id: "1",
        name: "1",
        changedBy: null,
        createdBy: {
            id: 1,
            name: null
        }
    },
    parent: null
};

function takesArtistInstance(artist: Instance<typeof builtMappedArtist>): void {
    artist.createdBy.id.toFixed();

    if (artist.createdBy.name !== null) {
        artist.createdBy.name.charAt(1);
    }

    if (artist.id !== undefined) {
        artist.id.toFixed();
    }

    if (artist.changedBy != null) {
        if (artist.changedBy.createdBy != null) {
            if (artist.changedBy.createdBy.name !== null) {
                artist.changedBy.createdBy.name.at(1);
            }
        }
    }

    if (artist.parent !== null) {
        if (artist.parent.country !== null) {
            artist.parent.country.createdById.toFixed();
        }
    }

    if (artist.country !== null) {
        artist.country.createdById.toFixed();
        artist.country.createdBy.id.toFixed();

        if (artist.country.createdBy.name !== null) {
            artist.country.createdBy.name.at(1);
        }

        if (artist.country.changedBy !== null) {
            artist.country.changedBy.id.toFixed();

            if (artist.country.changedBy.name !== null) {
                artist.country.changedBy.name.at(1);
            }
        }
    }
}

function takesArtistDtoInstance(artist: Instance.Dto<typeof builtMappedArtist>): void {
    artist.CreatedBy.id.toFixed();

    if (artist.CreatedBy.name !== null) {
        artist.CreatedBy.name.charAt(1);
    }

    if (artist.Id !== undefined) {
        artist.Id.toFixed();
    }

    if (artist.ChangedBy != null) {
        if (artist.ChangedBy.CreatedBy != null) {
            if (artist.ChangedBy.CreatedBy.name !== null) {
                artist.ChangedBy.CreatedBy.name.at(1);
            }
        }
    }

    if (artist.Parent !== null) {
        if (artist.Parent.Country !== null) {
            artist.Parent.Country.CreatedById.toFixed();
        }
    }

    if (artist.Country !== null) {
        artist.Country.CreatedById.toFixed();
        artist.Country.CreatedBy.id.toFixed();

        if (artist.Country.CreatedBy.name !== null) {
            artist.Country.CreatedBy.name.at(1);
        }

        if (artist.Country.ChangedBy !== null) {
            artist.Country.ChangedBy.id.toFixed();

            if (artist.Country.ChangedBy.name !== null) {
                artist.Country.ChangedBy.name.at(1);
            }
        }
    }
}
