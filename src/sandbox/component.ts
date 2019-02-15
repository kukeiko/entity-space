import { Type } from "./type";

export module Component {
    export type Aggregate<T extends Type<string>, S extends string, V extends Primitive.ValueType> = {
        aggregate: true;
        aggregatedFrom: { [k in S]: true; };
        aggregateValue(instance: {
            [P in S]: Property.WithKey<T, P> extends Property<any, infer X, infer M> ? "n" extends M ? X | null : X : never;
        }): ReturnType<V>;
    };

    export type Array = {
        array: true;
        ordered: boolean;
    };

    export type Complex = {
        complex: true;
    };

    // [todo] maybe merge back into Property (as Property.Dto)
    export type Dto<A extends string, D, M extends Modifier = never> = {
        dtoKey: A;
        modifiers: Record<M, true>;
        readDto<U extends Record<A, D>>(dtoInstance: U): D;
        writeDto<U extends Record<A, D>>(dtoInstance: U, value: D): void;
    };

    export module Dto {
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

    export type Id = {
        id: true;
    };

    // [note] i imagine this to be used for the system-id use case; "Ethereal" as name was chosen because i love it,
    // and there is a somewhat technically plausible reason for it (as per definition from wiktionary.com):
    // "Pertaining to the hypothetical upper, purer air, or to the higher regions beyond the earth or beyond the atmosphere; celestial; otherworldly."
    // => system A is otherworldly to system B and vice versa; they are out of each others' reach.
    // since it therefore can't be inferred from a dto, it has to be supplied to the thing that creates instances from dtos
    // *or* use Virtual instead (to make it easier) (but then again its not technically the same, even if perceived purpose feels similar)
    export type Ethereal = {
        ethereal: true;
    };

    export type External = {
        external: true;
    };

    export type Local = {
        local: true;
    };

    export module Local {
        export type Keys<T> = Exclude<{ [P in keyof T]: T[P] extends Local | undefined ? P : never }[keyof T], undefined>;

        export type Selected<V> = {
            selected: V;
        } & Local;
    }

    export type Modifier = Modifier.Creatable | Modifier.Nullable | Modifier.Patchable | Modifier.Unique;

    export module Modifier {
        export type Creatable = "c";
        export type Nullable = "n";
        export type Patchable = "p";
        export type Unique = "u";

        export module Unique {
            export type Keys<T> = Exclude<{ [P in keyof T]: T[P] extends Property<any, any, infer M> | undefined ? "u" extends M ? P : never : never }[keyof T], undefined>;
        }
    }

    export type Navigable<T extends Type<string>> = {
        navigable: true;
        navigated: T;
    };

    export module Navigable {
        export type Keys<T> = Exclude<{ [P in keyof T]: T[P] extends Navigable<any> | undefined ? P : never }[keyof T], undefined>;
        export type OtherType<N> = N extends Navigable<infer T> ? T : never;
        export type In<T> = { [K in Keys<T>]: T[K]; };

        export type Selected<T extends Type<string>> = {
            selected: T;
        } & Navigable<T>;
    }

    export type Primitive<T extends Primitive.ValueType> = {
        primitiveType: T;
    };

    export module Primitive {
        export type ValueType = BooleanConstructor | NumberConstructor | StringConstructor;
        export type Keys<T> = Exclude<{ [P in keyof T]: T[P] extends Primitive<any> | undefined ? P : never }[keyof T], undefined>;
    }

    export type Property<K extends string, V, M extends Modifier = never> = {
        key: K;
        modifiers: Record<M, true>;
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

    export type Virtual = {
        virtual: true;
    };
}
