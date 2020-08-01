import { Unbox, Primitive, Class } from "../utils";

export interface Property<K extends string = string, V extends Property.Value = Property.Value> {
    key: K;
    value: V;
}

export module Property {
    export type Keys<T, IS = Property, ISNOT = never> = Exclude<
        {
            [K in keyof T]: T[K] extends ISNOT ? never : T[K] extends Property & IS ? K : never;
        }[keyof T],
        undefined
    >;

    export type UnboxedValue<P> = P extends Property ? Unbox<Unbox<P["value"]>> : never;

    export type Value = Primitive[] | Class[] | (string | number)[];
}
