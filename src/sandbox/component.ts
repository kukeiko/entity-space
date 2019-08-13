import { Type } from "./type";

/**
 * Building blocks of properties.
 */
export module Component {
    /**
     * A property where its value is an array.
     */
    export type Array = {
        array: true;
        /**
         * Defines whether or not the order of values in the array matter when checking for differences.
         */
        ordered: boolean;
    };

    export type NotArray = {
        array: false;
    };

    /**
     * A property where the value is of type object.
     */
    export type Complex = {
        complex: true;
    };

    // export type Computed<T extends Type<string>, S extends string, V extends Primitive.ValueType, M extends Modifier = never> = {
    export type Computed<T, S extends string, V extends Primitive.ValueType, M extends "n" = never> = {
        computed: true;
        computedFrom: { [k in S]: true; };
        compute(instance: {
            [P in S]: Property.WithKey<T, P> extends Property<any, infer X, infer M> ? "n" extends M ? X | null : X : never;
        }): "n" extends M ? ReturnType<V> | null : ReturnType<V>;
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

        export type ModifierOf<T> = T extends Dto<any, any, infer M> ? M : never;
        export type ValueOf<T> = T extends Dto<any, infer D, any> ? D : never;
        export type WithAlias<T, A extends string> = WithAlias.Optional<T, A> | WithAlias.Required<T, A>;

        export module WithAlias {
            export type Optional<T, A extends string> = Exclude<{ [P in keyof T]: T[P] extends Dto<A, any> | undefined ? T[P] : never }[keyof T], undefined>;
            export type Required<T, A extends string> = Exclude<{ [P in keyof T]: T[P] extends Dto<A, any> ? T[P] : never }[keyof T], undefined>;
        }
    }

    export type Id = {
        id: true;
    };

    export type ExternalId<T extends Type<string>, P extends Modifier.Unique.Keys<T>> = {
        otherTypeKey: T["$"]["key"];
        otherIdKey: P;
    };

    /**
     * A property where its value can not be derived from the data transfer object and therefore needs to be supplied on the fly.
     */
    export type Ethereal = {
        ethereal: true;
    };

    /**
     * A property where the value is only accessable via the entity that owns the property.
     */
    export type Local = {
        local: true;
    };

    export module Local {
        export function is(x: any): x is Local {
            return x != null && (x as any as Local).local === true;
        }

        export type Keys<T> = Exclude<{ [P in keyof T]: T[P] extends Local | undefined ? P : never }[keyof T], undefined>;

        // [todo] this can't be right, we don't already have a value while creating a query
        // and selecting properties
        export type Selected<V> = {
            selected: V;
        } & Local;
    }

    /**
     * Flags for making a property creatable, nullable, patchable and unique.
     */
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

    /**
     * A property where the value has further properties we can select (e.g. for loading, patching, ...)
     */
    export type Navigable<T extends Type<string>> = {
        navigable: true;
        /**
         * The type that is navigated towards.
         */
        navigated: T;
    };

    export module Navigable {
        export function is(x: any): x is Navigable<any> {
            return x != null && (x as any as Navigable<any>).navigable === true;
        }

        export type Keys<T> = Exclude<{ [P in keyof T]: T[P] extends Navigable<any> | undefined ? P : never }[keyof T], undefined>;

        /**
         * Returns the type the given navigable property navigates towards
         */
        export type OtherType<N> = N extends Navigable<infer T> ? T : never;

        export type Selected<T extends Type<string>> = {
            selected: T;
        } & Navigable<T>;

        /**
         * A navigable property where the value can be accessed separately
         */
        export type External<T extends Type<string>>
            = {
                external: true;
            }
            & Navigable<T>;
    }

    /**
     * A property that contains a primitive type (boolean, number, string).
     */
    export type Primitive<T extends Primitive.ValueType> = {
        primitiveType: T;
    };

    export module Primitive {
        export type ValueType = BooleanConstructor | NumberConstructor | StringConstructor;
        export type ValueTypeOf<T> = T extends Primitive<infer V> ? V : never;
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

        export type ModifierOf<T> = T extends Property<any, any, infer M> ? M : never;
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
