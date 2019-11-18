/**
 * The union of all native constructors that return a primitive.
 */
export type Primitive = typeof Boolean | typeof Number | typeof String;

export type Class = new (...args: any) => any;

/**
 * Takes a type T and returns:
 *  - the contained type if it is an Array
 *  - the instantiated type if it is a Class
 *  - the returned type if it is a Function
 *  - T if it is none of the options above
 */
export type Unbox<T>
    = T extends any[] ? T[number]
    : T extends Class ? InstanceType<T>
    : T extends (...args: any[]) => any ? ReturnType<T>
    : T;
