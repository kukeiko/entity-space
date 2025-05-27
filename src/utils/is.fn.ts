export function is<T>(type: T): (value: unknown) => value is T {
    return (value: unknown): value is T => value === type;
}
