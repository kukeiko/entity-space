export function walkPath<T>(path: string, object: Record<string, any>): T | undefined {
    if (path === "") return object as T;

    for (const segment of path.split(".")) {
        object = object[segment];

        if (object === void 0) {
            return object;
        }
    }

    return object as T;
}