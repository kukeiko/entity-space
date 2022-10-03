export function writePath<T>(path: string, object: Record<string, any>, value: T): Record<string, any> {
    const segments = path.split(".");
    let next = object;

    for (let i = 0; i < segments.length - 1; ++i) {
        const segment = segments[i];
        next = next[segment] ?? (next[segment] = {});
    }

    next[segments[segments.length - 1]] = value;

    return object;
}
