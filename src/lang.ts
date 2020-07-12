/**
 * [note] this file contains the most atomic and non-entity-space specific types.
 * you could consider it to be a universal extension to typescript/lib.d.ts
 */

/**
 * The union of all native constructors that return a primitive.
 */
export type Primitive = typeof Boolean | typeof Number | typeof String;

export module Primitive {
    export function is(x?: any): x is Primitive {
        return x === Boolean || x === Number || x === String;
    }
}

/**
 * A type that has a constructor.
 */
export type Class<T = any> = new (...args: any) => T;

/**
 * Takes a type T and returns:
 *  - the contained type if T is an Array, which is T[number]
 *  - the instantiated type if T is a Class, which is InstanceType<T>
 *  - the returned type if it T a Function, which is ReturnType<T>
 *  - T if none of the above
 */
export type Unbox<T> = T extends any[] ? T[number] : T extends Class ? InstanceType<T> : T extends (...args: any[]) => any ? ReturnType<T> : T;

export type Box<T, U = any[]> = U extends any[] ? T[] : T;

export type Replace<T, K extends keyof T, V> = Omit<T, K> & Record<K, V>;

export interface StringIndexable {
    [key: string]: any;
}

// export type FieldKeys<T> = ({ [K in keyof T]: T[K] extends (...args: any[]) => any ? never : K; })[keyof T];
export type Fields<T> = Exclude<{ [K in keyof T]: T[K] extends (...args: any[]) => any ? never : K }[keyof T], undefined>;

// export type Fields<T> = Pick<T, FieldKeys<T>>;

export type Json = string | number | boolean | null | Json[] | { [property: string]: Json };
