export function isFalse<T>(x: T | false): x is false {
    return x === false;
}
