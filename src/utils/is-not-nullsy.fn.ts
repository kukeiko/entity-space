export function isNotNullsy<T>(x: T): x is Exclude<T, null | undefined> {
    return x != null;
}
