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

    export type Dto<A extends string, D, M extends Dto.Modifier = never> = {
        dtoKey: A;
        options: Record<M, true>;
        readDto<U extends Record<A, D>>(dtoInstance: U): D;
        writeDto<U extends Record<A, D>>(dtoInstance: U, value: D): void;
    };

    export module Dto {
        export type Modifier = "p" | "c" | "n";
        export type Aliases<T> = Aliases.Optional<T> | Aliases.Required<T>;

        export module Aliases {
            export type Optional<T> = Exclude<{ [P in keyof T]: undefined extends T[P] ? (T[P] extends Dto<infer A, any, any> | undefined ? A : never) : never }[keyof T], undefined>;
            export type Required<T> = Exclude<{ [P in keyof T]: T[P] extends Dto<infer A, any> ? A : never }[keyof T], undefined>;
        }

        export type ValueOf<T> = T extends Dto<any, infer D> ? D : never;

        export type WithAlias<T, A extends string> = WithAlias.Optional<T, A> | WithAlias.Required<T, A>;

        export module WithAlias {
            export type Optional<T, A extends string> = Exclude<{ [P in keyof T]: T[P] extends Dto<A, any> | undefined ? T[P] : never }[keyof T], undefined>;
            export type Required<T, A extends string> = Exclude<{ [P in keyof T]: T[P] extends Dto<A, any> ? T[P] : never }[keyof T], undefined>;
        }
    }

    export type Filterable = {
        filterable: true;
    };

    export module Filterable {
        export type Type = "boolean" | "number" | "string";
    }

    export type Id = {
        id: true;
    };

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
    };

    export type External = {
        external: true;
    };

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

    export type Property<K extends string, V, M extends Property.Modifier = never> = {
        key: K;
        options: Record<M, true>;
        read<U extends Record<K, V>>(instance: U): V;
        write<U extends Record<K, V>>(instance: U, value: V): void;
    };

    export module Property {
        export type Modifier = "p" | "c" | "n";
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

    export type Simple = {
        simple: true;
    };

    export type Unique = {
        unique: true;
    };

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
export type Instance<T> = Box<Instance.Optional<Unbox<T>> & Instance.Required<Unbox<T>>, T>;

export module Instance {
    type FetchM<T> = T extends Component.Property<any, any, infer M> ? M : never;
    type FetchDtoM<T> = T extends Component.Dto<any, any, infer M> ? M : never;

    // [todo] figure out if "T[K] is in any way faster than "Component.Property.WithKey<T, K>"
    export type Optional<T> = {
        [K in Component.Property.Keys.Optional<T>]?
        : T[K] extends Component.Expanded<infer E> | undefined ? ("n" extends FetchM<T[K]> ? Instance<E> | null : Instance<E>)
        : T[K] extends Component.Property<K, infer V, infer M> | undefined ? "n" extends M ? V | null : V
        : never
    };

    export type Required<T> = {
        [K in Component.Property.Keys.Required<T>]
        : T[K] extends Component.Expanded<infer E> ? ("n" extends FetchM<T[K]> ? Instance<E> | null : Instance<E>)
        : T[K] extends Component.Property<K, infer V, infer M> ? "n" extends M ? V | null : V
        : never
    };

    export type Dto<T> = Box<Dto.Optional<Unbox<T>> & Dto.Required<Unbox<T>>, T>;

    export module Dto {
        export type Optional<T> = {
            [A in Component.Dto.Aliases.Optional<T>]?
            : Component.Dto.WithAlias<T, A> extends Component.Expanded<infer E> | undefined ? "n" extends FetchDtoM<Component.Dto.WithAlias<T, A>> ? Instance.Dto<E> | null : Instance.Dto<E>
            : Component.Dto.WithAlias<T, A> extends Component.Dto<A, infer D, infer M> | undefined ? "n" extends M ? D | null : D
            : never
        };

        export type Required<T> = {
            [A in Component.Dto.Aliases.Required<T>]
            : Component.Dto.WithAlias<T, A> extends Component.Expanded<infer E> ? "n" extends FetchDtoM<Component.Dto.WithAlias<T, A>> ? Instance.Dto<E> | null : Instance.Dto<E>
            : Component.Dto.WithAlias<T, A> extends Component.Dto<A, infer D, infer M> ? "n" extends M ? D | null : D
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
    T extends Type<string>,
    P extends Reference.Id<any, T, any>,
    A extends string = K,
    M extends Component.Property.Modifier = never> = {
        localKey: P;
    }
    & Component.Dto<A, Instance.Dto<T>, M>
    // & Component.Dto<A, Partial<Instance.Dto<T>>>
    & Component.External
    // [note] as of now i think it makes the most sense that the value of a reference is partial by default,
    // since it can't know which parts of navigated type have been selected/expanded
    // & Component.Property<K, Partial<Instance<T>>>
    & Component.Property<K, Instance<T>, M>
    & Component.Navigable<T>
    ;

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
    select<K extends Component.Local.Keys<T>, S = Exclude<T[K], undefined>>(k: K): TypeMapper<T, Record<K, S> & M> {
        return this as any;
    }

    selectIf<K extends Component.Local.Keys<T>, S = Exclude<T[K], undefined>>(k: K, flag: boolean): TypeMapper<T, Record<K, S | undefined> & M> {
        return this as any;
    }

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
    id: Id<"id", number, "Id">;
    name: Simple<"name", typeof String | null, "Name">;

    createdById: Reference.Id<"createdById", UserType, "id", "CreatedById", "n">;
    createdBy: Reference<"createdBy", UserType, UserType["createdById"], "CreatedBy", "n">;

    changedAt: Simple<"changedAt", typeof Date, "ChangedAt">;
    changedById: Reference.Id<"changedById", UserType, "id", "ChangedById", "n">;
    changedBy: Reference<"changedBy", UserType, UserType["changedById"], "ChangedBy", "n">;
}

export interface CountryType extends Type<"country"> {
    id: Id<"id", string>;
    name: Simple<"name", typeof String>;

    createdById: Reference.Id<"createdById", UserType, "id", "CreatedById">;
    createdBy: Reference<"createdBy", UserType, CountryType["createdById"], "CreatedBy">;

    changedAt: Simple<"changedAt", typeof Date, "ChangedAt">;
    changedById: Reference.Id<"changedById", UserType, "id", "ChangedById", "n">;
    changedBy: Reference<"changedBy", UserType, CountryType["changedById"], "ChangedBy", "n">;
}

export interface ArtistType extends Type<"artist"> {
    id: Id<"id", number, "Id", number, "n">;

    createdAt: Simple<"createdAt", typeof Date, "CreatedAt", number>;
    createdById: Reference.Id<"createdById", UserType, "id", "CreatedById">;
    createdBy: Reference<"createdBy", UserType, ArtistType["createdById"], "CreatedBy">;

    changedAt: Simple<"changedAt", typeof Date, "ChangedAt">;
    changedById: Reference.Id<"changedById", UserType, "id", "ChangedById", "n" | "p">;
    changedBy: Reference<"changedBy", UserType, ArtistType["changedById"], "ChangedBy", "n">;

    parentId: Reference.Id<"parentId", ArtistType, "id", "ParentId", "n">;
    parent: Reference<"parent", ArtistType, ArtistType["parentId"], "Parent", "n">;
    // children: Child<"children", ArtistType, "parent">;
    // albums: Child<"albums", AlbumType[], "artist">;

    countryId: Reference.Id<"countryId", CountryType, "id", "CountryId", "n">;
    country: Reference<"country", CountryType, ArtistType["countryId"], "Country", "n">;
    // countryId: Reference.Id<"countryId", CountryType , "id", "CountryId">;
    // country: Reference<"country", CountryType , ArtistType["countryId"], "Country">;

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

export type ConstructionOptions<T> = {
    [K in Component.Property.Keys<T>]
    : ConstructionOptions.ReferenceOptions<T[K]>
    & ConstructionOptions.ReferenceIdOptions<T[K]>
    ;
};

module ConstructionOptions {
    export type ReferenceOptions<X> = X extends Reference<infer K, infer T, infer P, infer A>
        ? {
            localIdKey: P["key"];
        } : {};

    export type ReferenceIdOptions<X> = X extends Reference.Id<infer K, infer T, infer P, infer A, infer M>
        ? {
            otherKey: T["$"]["key"];
            otherIdKey: P;
        }
        & ModifierOptions<X>
        : {};

    export type ModifierOptions<X> = X extends Component.Property<infer K, infer V, infer M>
        ? (
            ("p" extends M ? { options: { p: true; }; } : {})
            & ("c" extends M ? { options: { c: true; }; } : {})
            & ("n" extends M ? { options: { n: true; }; } : {})
        ) : {};
}

let artistCtorOptions: ConstructionOptions<ArtistType> = {
    changedAt: {
        options: {

        }
    },
    changedBy: {
        localIdKey: "changedById",

        // localIdKey: "changedById",
    },
    changedById: {
        options: {
            n: true,
            p: true
        },
        otherIdKey: "id",
        otherKey: "user"
        // otherIdKey: "id",
        // otherKey: "user"
    },
    country: {
        localIdKey: "countryId"
    },
    countryId: {
        options: {
            n: true
        },
        otherIdKey: "id",
        otherKey: "country"
    },
    createdAt: {},
    createdBy: {
        localIdKey: "createdById"
    },
    createdById: {
        otherKey: "user",
        otherIdKey: "id"
    },
    id: {},
    parent: {
        localIdKey: "parentId"
    },
    parentId: {
        options: {
            n: true
        },
        otherIdKey: "id",
        otherKey: "artist"
    }
};

let countryCtorOptions: ConstructionOptions.ReferenceOptions<ArtistType["country"]> = {
    localIdKey: "countryId"
};

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
        clone: Date,
        dtoKey: "ChangedAt",
        key: "changedAt",
        local: true,
        options: {},
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
        options: {
            n: true
        },
        read: x => x.changedBy,
        readDto: x => x.ChangedBy,
        write: (x, v) => x.changedBy = v,
        writeDto: (x, v) => x.ChangedBy = v
    },
    changedById: {
        dtoKey: "ChangedById",
        key: "changedById",
        local: true,
        options: {
            n: true,
            p: true
        },
        otherIdKey: "id",
        // otherIdKey: null as any as UserType["id"],
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
        options: {
            n: true,
        },
        read: x => x.country,
        readDto: x => x.Country,
        write: (x, v) => x.country = v,
        writeDto: (x, v) => x.Country = v
    },
    countryId: {
        dtoKey: "CountryId",
        key: "countryId",
        local: true,
        options: {
            n: true
        },
        // otherIdKey: null as any as CountryType["id"],
        otherIdKey: "id",
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
        options: {},
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
        options: {},
        read: x => x.createdBy,
        readDto: x => x.CreatedBy,
        write: (x, v) => x.createdBy = v,
        writeDto: (x, v) => x.CreatedBy = v
    },
    createdById: null as any,
    parentId: {
        dtoKey: "ParentId",
        key: "parentId",
        local: true,
        options: {
            n: true
        },
        // otherIdKey: null as any as ArtistType["id"],
        otherIdKey: "id",
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
        options: {
            n: true
        },
        readDto: x => x.Parent,
        writeDto: (u, v) => u.Parent = v,
        read: x => x.parent,
        write: (x, v) => x.parent = v,
    }
};

let artistDtoInstances: Instance.Dto<ArtistType[]> = [
    {
        ChangedAt: "2019",
        // Country: null,
        Country: {
            ChangedAt: "foo",
            ChangedBy: {
                ChangedAt: "2019",
                ChangedBy: null,
                ChangedById: 3,
                CreatedBy: null,
                CreatedById: 123,
                Id: 3,
                Name: "foo"
            },
            ChangedById: 123,
            CreatedBy: {
                ChangedAt: "2019",
                ChangedBy: null,
                ChangedById: null,
                CreatedBy: null,
                CreatedById: 3,
                Id: 3,
                Name: "foo"
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
            ChangedAt: "2019",
            CreatedAt: 56,
            CreatedBy: null as any as Instance.Dto<UserType>,
            CreatedById: 1,
            Id: 2,
            Parent: null,
            // ReviewIds: [1, 2, 3],
            ParentId: null,
            ChangedById: null,
            ChangedBy: null
        },
        ChangedBy: null,
        ChangedById: null
        // ReviewIds: []
    }
];

let artistMapper = new TypeMapper<ArtistType>()
    .selectIf("id", true)
    .select("countryId")
    .select("changedById")
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
let builtMappedArtistInstances: Instance<typeof builtMappedArtist[]> = [
    {
        changedById: null,
        changedBy: null,
        countryId: null,
        createdBy: {
            id: 1,
            name: "foo"
        },
        country: null,
        parent: null
    }
];

let builtMappedArtistDtoInstances: Instance.Dto<(typeof builtMappedArtist)[]> = [
    {
        ChangedBy: null,
        ChangedById: null,
        Country: null,
        CountryId: null,
        CreatedBy: {
            Id: 1,
            Name: null
        },
        Id: undefined,
        Parent: null
    }
];

function takesArtistInstance(artist: Instance<typeof builtMappedArtist>): void {
    artist.createdBy.id.toFixed();
    artist.changedById = null;

    if (artist.createdBy.name !== null) {
        artist.createdBy.name.charAt(1);
    }

    if (artist.id !== undefined) {
        if (artist.id !== null) {
            artist.id.toFixed();
        }
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
    artist.CreatedBy.Id.toFixed();

    if (artist.CreatedBy.Name !== null) {
        artist.CreatedBy.Name.charAt(1);
    }

    if (artist.Id !== undefined) {
        if (artist.Id !== null) {
            artist.Id.toFixed();
        }
    }

    // artist.ChangedBy = null;

    if (artist.ChangedBy != null) {
        if (artist.ChangedBy.CreatedBy != null) {
            if (artist.ChangedBy.CreatedBy.Name !== null) {
                artist.ChangedBy.CreatedBy.Name.at(1);
            }
        }
    }

    // artist.Parent = null;

    if (artist.Parent !== null) {
        if (artist.Parent.Country !== null) {
            artist.Parent.Country.CreatedById.toFixed();
        }
    }

    if (artist.Country !== null) {
        artist.Country.CreatedById.toFixed();
        artist.Country.CreatedBy.Id.toFixed();

        if (artist.Country.CreatedBy.Name !== null) {
            artist.Country.CreatedBy.Name.at(1);
        }

        if (artist.Country.ChangedBy !== null) {
            artist.Country.ChangedBy.Id.toFixed();

            if (artist.Country.ChangedBy.Name !== null) {
                artist.Country.ChangedBy.Name.at(1);
            }
        }
    }
}
