export function isString<T>(value: T): value is T & string {
    return typeof value === "string";
}
