import { AbstractClass, Class } from "./types";

export function isInstanceOf<T>(cls: Class<T> | AbstractClass<T>): (value: unknown) => value is T {
    return (value => value instanceof cls) as (value: unknown) => value is T;
}
