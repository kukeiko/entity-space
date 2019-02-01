import { Property } from "../property";
import { Local } from "./local";
import { Unique } from "./unique";

export type Id<V extends string | number, K extends string, A extends string = K, D = V> = {
    id: true;
} & Unique<V, K, A, D>;

export module Id {
    export type Keys<T> = Exclude<{ [P in keyof T]: T[P] extends Id<any, infer K, any> | undefined ? K : never }[keyof T], undefined>;

    export type Virtual<V extends string | number, K extends string, T, I extends Local.Keys<T>, A extends string = K, D = V> = {
        computeValue(instance: { [P in I]: P extends string ? Property.WithKey<T, P> : never }): V;
    } & Id<V, K, A, D>;

    export module Virtual {
        export function is(x: any): x is Virtual<any, any, any, any> {
            return x instanceof Object && x.computeValue instanceof Function;
        }
    }

    export type Computed<V extends string | number, K extends string, T, I extends Local.Keys<T>, A extends string = K, D = V> = {
        computeValue(instance: { [P in I]: P extends string ? Property.WithKey<T, P> : never }): V;
    } & Id<V, K, A, D>;

    export module Computed {
        export function is(x: any): x is Computed<any, any, any, any> {
            return x instanceof Object && x.computeValue instanceof Function;
        }
    }
}
