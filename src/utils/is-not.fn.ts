export function isNot<T, U>(type: T): (value: U) => value is Exclude<U, T> {
    return (value: any): value is Exclude<U, T> => value !== type;
}
