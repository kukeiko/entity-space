export function isNullsy<T>(x: T): x is Extract<T, null | undefined> {
    return x == null;
}
