import { Unbox } from "../utils";
import { PropertyBuilder } from "./property-builder";

// [todo] we don't use 'key' yet afaik - maybe we should remove it?
export interface Property<K extends string = string, V = any> {
    key: K;
    value: V;
}

export module Property {
    export function pick<T>(type: T, predicate: (p: Property) => boolean = () => true): Record<string, Property> {
        const fields: Record<string, Property> = {};

        for (const k in type) {
            const candidate = type[k];

            if (Property.is(candidate) && predicate(candidate)) {
                fields[k] = candidate;
            }
        }

        return fields;
    }

    /**
     * The keys in T that point to a Property optionally extending P.
     */
    export type Keys<T, IS = Property, ISNOT = never> = Exclude<
        {
            [K in keyof T]: T[K] extends ISNOT ? never : T[K] extends Property & IS ? K : never;
        }[keyof T],
        undefined
    >;

    /**
     * Takes a property P and exchanges its value with what is provided for V.
     */
    export type ReplaceValue<P, V> = Omit<P, "value"> & { value: V };

    export type KeyOfAliased<T, A extends string> = { [K in keyof T]: T[K] extends Property & { alias: A } ? K : never }[keyof T];

    export type Aliased<T, A extends string> = T[KeyOfAliased<T, A>] extends Property ? T[KeyOfAliased<T, A>] : never;

    // export type Primitive<K extends string = string, V = any, A extends string = K> = Property<K, V, A>;

    // export type UnboxedValue<P extends Property> = Unbox<Unbox<P["value"]>>;
    export type UnboxedValue<P> = P extends Property ? Unbox<Unbox<P["value"]>> : never;

    // export function isPrimitive(p: any): p is Primitive {
    //     return is(p) && p.primitive === true;
    // }

    // export type Complex<K extends string = string, V = any, A extends string = K> = Property<K, V, A>;

    // export function isComplex(p: any): p is Complex {
    //     return is(p) && p.primitive === false;
    // }

    export function is(x?: any): x is Property {
        x = x || {};

        return typeof (x as Property).key === "string" && (x as Property).value != null;
    }

    export function create<K extends string, V, P extends Property<K, V> = Property<K, V>>(
        key: K,
        value: V,
        builder: (builder: PropertyBuilder<K, V>) => PropertyBuilder<K, V, P> = builder => builder as PropertyBuilder<K, V, P>
    ): P {
        return builder(new PropertyBuilder(key, value)).build();
    }

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
