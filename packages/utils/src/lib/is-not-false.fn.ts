export function isNotFalse<T>(x: T | false): x is T {
    return x !== false;
}
