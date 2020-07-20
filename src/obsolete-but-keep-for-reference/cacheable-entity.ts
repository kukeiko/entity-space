import { Primitive } from "../utils";

export type CacheableEntity<T> = Pick<T, CacheableEntity.Fields<T>>;

export module CacheableEntity {
    export type Fields<T> = Exclude<{ [K in keyof T]: T[K] extends ReturnType<Primitive> | undefined | null ? K : never }[keyof T], undefined>;
}
