import { Null } from "./null";

/**
 * A type that has a constructor.
 */
export type Class<T = any> = new (...args: any) => T; // | (abstract new (...args: any) => T); [todo] remove commented out code if no longer relevant
export type AbstractClass<T = any> = abstract new (...args: any) => T;

export type DeepPartial<T> = T extends object
    ? {
          [P in keyof T]?: DeepPartial<T[P]>;
      }
    : T;

export type Json = string | number | boolean | null | Json[] | { [property: string]: Json };

export type PrimitiveIncludingNull = Primitive | typeof Null;

/**
 * The union of all native constructors that return a primitive.
 */
export type Primitive = typeof Boolean | typeof Number | typeof String;

export type Unbox<T> = T extends any[] ? T[number] : T;
