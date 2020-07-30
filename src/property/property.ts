import { Unbox, Primitive, Class } from "../utils";

// [todo] we don't use 'key' yet afaik - maybe we should remove it? => actually, we would need it for oldschool style selector
export interface Property<K extends string = string, V extends Property.Value = Property.Value> {
    key: K;
    value: V;
}

export module Property {
    /**
     * The keys in T that point to a Property optionally extending P.
     */
    export type Keys<T, IS = Property, ISNOT = never> = Exclude<
        {
            [K in keyof T]: T[K] extends ISNOT ? never : T[K] extends Property & IS ? K : never;
        }[keyof T],
        undefined
    >;

    export type UnboxedValue<P> = P extends Property ? Unbox<Unbox<P["value"]>> : never;

    export type Value = Primitive[] | Class[] | (string | number)[];

    /**
     * [note] commented it out for now due to premature user experience optimisation.
     * for now i'll just always call loadable() when defining a property.
     */
    // export function define<K extends string, V, P = Property<K, V>>(key: K, value: V): P & IsLoadable;
    // export function define<K extends string, V, P extends Property<K, V> = Property<K, V>>(key: K, value: V, b: (builder: PropertyBuilder<K, V>) => PropertyBuilder<K, V, P>): P extends IsLoadable<true, any, any> ? P : P & IsLoadable;

    // export function define(...args: any[]): any {
    //     let key = args[0] as string;
    //     let value = args[1];

    //     if (args.length === 2) {
    //         return new PropertyBuilder(key, value).loadable().build();
    //     } else {
    //         return args[2](new PropertyBuilder(key, value).loadable()).build();
    //     }
    // }
}
