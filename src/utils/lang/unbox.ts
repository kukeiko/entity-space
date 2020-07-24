/**
 * Takes a type T and returns:
 *  - the contained type if T is an Array, which is T[number]
 *  - the instantiated type if T is a Class, which is InstanceType<T>
 *  - the returned type if it T a Function, which is ReturnType<T>
 *  - T if none of the above
 */
// [todo] check if we should use the same switch of T & any[] as we've done with U & any[] @ Box<T, U> type.

import { Class } from "./class";

// even if there are no errors, maybe it increases type performance?
// [todo] commented out because, again, excessively deep type instantiation
// export type Unbox<T> = T extends any[] ? T[number] : T extends Class ? InstanceType<T> : T extends (...args: any[]) => any ? ReturnType<T> : T;
export type Unbox<T> = T extends Array<infer U> ? U : T extends Class ? InstanceType<T> : T extends (...args: any[]) => any ? ReturnType<T> : T;
