export type Property<V, K extends string, A extends string, D> = {
    dtoKey: A;
    key: K;
    read<U extends Record<K, V>>(instance: U): V;
    readDto<U extends Record<A, D>>(dtoInstance: U): D;
    write<U extends Record<K, V>>(instance: U, value: V): void;
    writeDto<U extends Record<A, D>>(dtoInstance: U, value: D): void;
} & (V extends any[] ? { array: true; ordered: boolean; } : {}) & (V extends null ? { nullable: true } : {});

export module Property {
    export type Keys<T> = Keys.Optional<T> | Keys.Required<T>;

    export module Keys {
        export type Optional<T> = Exclude<{ [P in keyof T]: undefined extends T[P] ? (T[P] extends Property<any, infer K, any, any> | undefined ? K : never) : never }[keyof T], undefined>;
        export type Required<T> = Exclude<{ [P in keyof T]: T[P] extends Property<any, infer K, any, any> ? K : never }[keyof T], undefined>;
    }

    export type WithKey<T, A extends string>
        = A extends Keys.Optional<T> ? WithKey.Optional<T, A>
        : A extends Keys.Required<T> ? WithKey.Required<T, A>
        : never;

    export module WithKey {
        export type Optional<T, K extends string> = Exclude<{ [P in keyof T]: T[P] extends Property<any, K, any, any> | undefined ? T[P] : never }[keyof T], undefined>;
        export type Required<T, K extends string> = Exclude<{ [P in keyof T]: T[P] extends Property<any, K, any, any> ? T[P] : never }[keyof T], undefined>;
    }

    export type ValueType<X> = X extends Property<infer V, any, any, any> ? V : never;
    // export type ValueType<X> = X extends Property<infer V, infer _2, infer _3, infer _4> ? V : never;

    export type Array<V extends any[], K extends string> = Property<V, K, any, any>;

    export module Array {
        export type Keys<T> = Exclude<{ [P in keyof T]: T[P] extends Property<any[] | null, infer K, any, any> ? K : never }[keyof T], undefined>;
    }

    export module Dto {
        export type OptionalKeys<T> = Exclude<{ [P in keyof T]: undefined extends T[P] ? (T[P] extends Property<any, any, infer A, any> | undefined ? A : never) : never }[keyof T], undefined>;
        export type RequiredKeys<T> = Exclude<{ [P in keyof T]: T[P] extends Property<any, any, infer A, any> ? A : never }[keyof T], undefined>;
        export type Keys<T> = OptionalKeys<T> | RequiredKeys<T>;
        export type ValueType<T> = T extends Property<any, any, any, infer D> ? D : never;
        // export type ValueType<T> = T extends Property<infer _1, infer _2, infer _3, infer D> ? D : never;

        export type OptionalWithKey<T, A extends string> = Exclude<{ [P in keyof T]: T[P] extends Property<any, any, A, any> | undefined ? T[P] : never }[keyof T], undefined>;
        export type RequiredWithKey<T, A extends string> = Exclude<{ [P in keyof T]: T[P] extends Property<any, any, A, any> ? T[P] : never }[keyof T], undefined>;
        export type WithKey<T, A extends string>
            = A extends OptionalKeys<T> ? OptionalWithKey<T, A>
            : A extends RequiredKeys<T> ? RequiredWithKey<T, A>
            : never;
    }
}
