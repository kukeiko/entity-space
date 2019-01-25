export type Property<V, K extends string> = {
    isArray: boolean;
    name: K;
    readValue<U extends Record<K, V>>(instance: U): V;
    writeValue<U extends Record<K, V>>(instance: U, value: V): void;
};

// [todo] consider merging Property w/ Property.Dto
export module Property {
    export type Keys<T> = Keys.Optional<T> | Keys.Required<T>;

    export module Keys {
        export type Optional<T> = Exclude<{ [P in keyof T]: undefined extends T[P] ? (T[P] extends Property<any, infer K> | undefined ? K : never) : never }[keyof T], undefined>;
        export type Required<T> = Exclude<{ [P in keyof T]: T[P] extends Property<any, infer K> ? K : never }[keyof T], undefined>;
    }

    export type WithKey<T, A extends string>
        = A extends Keys.Optional<T> ? WithKey.Optional<T, A>
        : A extends Keys.Required<T> ? WithKey.Required<T, A>
        : never;

    export module WithKey {
        export type Optional<T, K extends string> = Exclude<{ [P in keyof T]: T[P] extends Property<any, K> | undefined ? T[P] : never }[keyof T], undefined>;
        export type Required<T, K extends string> = Exclude<{ [P in keyof T]: T[P] extends Property<any, K> ? T[P] : never }[keyof T], undefined>;
    }

    // export type OptionalKeys<T> = Exclude<{ [P in keyof T]: undefined extends T[P] ? (T[P] extends Property<any, infer K> | undefined ? K : never) : never }[keyof T], undefined>;
    // export type RequiredKeys<T> = Exclude<{ [P in keyof T]: T[P] extends Property<any, infer K> ? K : never }[keyof T], undefined>;

    export type ValueType<X> = X extends Property<infer V, any> ? V : never;

    // export type OptionalWithKey<T, K extends string> = Exclude<{ [P in keyof T]: T[P] extends Property<any, K> | undefined ? T[P] : never }[keyof T], undefined>;
    // export type RequiredWithKey<T, K extends string> = Exclude<{ [P in keyof T]: T[P] extends Property<any, K> ? T[P] : never }[keyof T], undefined>;
    // export type WithKey<T, A extends string>
    //     = A extends OptionalKeys<T> ? OptionalWithKey<T, A>
    //     : A extends RequiredKeys<T> ? RequiredWithKey<T, A>
    //     : never;

    // export type OptionalWithKey<T, K extends OptionalKeys<T>> = Exclude<{ [P in keyof T]: T[P] extends Property<any, K> | undefined ? T[P] : never }[keyof T], undefined>;
    // export type RequiredWithKey<T, K extends RequiredKeys<T>> = Exclude<{ [P in keyof T]: T[P] extends Property<any, K> ? T[P] : never }[keyof T], undefined>;
    // export type WithKey<T, A extends Keys<T>>
    //     = A extends OptionalKeys<T> ? OptionalWithKey<T, A>
    //     : A extends RequiredKeys<T> ? RequiredWithKey<T, A>
    //     : never;

    export type Dto<V, K extends string, A extends string = K, D = V> = Property<V, K> & {
        dtoName: A;
        readDtoValue<U extends Record<A, D>>(dtoInstance: U): D;
        writeDtoValue<U extends Record<A, D>>(dtoInstance: U, value: D): void;
        // fromDto: (dtoValue: D) => V;
        // toDto: (value: V) => D;
    };

    export module Dto {
        export type OptionalKeys<T> = Exclude<{ [P in keyof T]: undefined extends T[P] ? (T[P] extends Dto<any, any, infer A> | undefined ? A : never) : never }[keyof T], undefined>;
        export type RequiredKeys<T> = Exclude<{ [P in keyof T]: T[P] extends Dto<any, any, infer A> ? A : never }[keyof T], undefined>;
        export type Keys<T> = OptionalKeys<T> | RequiredKeys<T>;
        export type ValueType<T> = T extends Dto<any, any, any, infer D> ? D : never;

        export type OptionalWithKey<T, A extends string> = Exclude<{ [P in keyof T]: T[P] extends Dto<any, any, A> | undefined ? T[P] : never }[keyof T], undefined>;
        export type RequiredWithKey<T, A extends string> = Exclude<{ [P in keyof T]: T[P] extends Dto<any, any, A> ? T[P] : never }[keyof T], undefined>;
        export type WithKey<T, A extends string>
            = A extends OptionalKeys<T> ? OptionalWithKey<T, A>
            : A extends RequiredKeys<T> ? RequiredWithKey<T, A>
            : never;

        // export type OptionalWithKey<T, A extends OptionalKeys<T>> = Exclude<{ [P in keyof T]: T[P] extends Dto<any, any, A> | undefined ? T[P] : never }[keyof T], undefined>;
        // export type RequiredWithKey<T, A extends RequiredKeys<T>> = Exclude<{ [P in keyof T]: T[P] extends Dto<any, any, A> ? T[P] : never }[keyof T], undefined>;
        // export type WithKey<T, A extends Keys<T>>
        //     = A extends OptionalKeys<T> ? OptionalWithKey<T, A>
        //     : A extends RequiredKeys<T> ? RequiredWithKey<T, A>
        //     : never;
    }
}
