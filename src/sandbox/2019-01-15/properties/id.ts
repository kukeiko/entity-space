import { Unique } from "./unique";

// [todo] waddabout writable ids?
export type Id<V extends string | number, K extends string, A extends string = K, D = V> = Unique<V, K, A, D> & {
    readonly: true;
};

export module Id {
    export type Keys<T> = Exclude<{ [P in keyof T]: T[P] extends Id<any, infer K, any> | undefined ? K : never }[keyof T], undefined>;
}
