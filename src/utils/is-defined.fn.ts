export function isDefined<T>(x: T): x is Exclude<T, undefined> {
    return x !== undefined;
}
