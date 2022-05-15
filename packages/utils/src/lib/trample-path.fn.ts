export function tramplePath<T>(path: string, object: Record<string, any>, value: T): T {
    const segments = path.split(".");

    for (let i = 0; i < segments.length - 1; ++i) {
        const segment = segments[i];
        object = object[segment] ?? (object[segment] = {});
    }

    object[segments[segments.length - 1]] = value;

    return value;
}
