import { isNotNullsy } from "./is-not-nullsy.fn";

const $path = Symbol();

export type Path = String & { readonly [$path]: readonly string[] };

export function toPath(path: string): Path {
    if (typeof path !== "string") {
        throw new Error(`"${path}" is not a valid path because it is not a string`);
    } else if (!path.length) {
        throw new Error(`"${path}" is not a valid path because it's empty`);
    }

    const segments = path.split(".");

    if (segments.some(segment => !segment.length)) {
        throw new Error(`"${path}" contains an empty segment`);
    }

    const wrapped = new String(path);
    (wrapped as any)[$path] = Object.freeze(segments);

    return wrapped as Path;
}

export function toPaths(paths: readonly string[]): Path[] {
    const wrapped = paths.map(toPath);
    assertValidPaths(wrapped);

    return wrapped;
}

export function joinPaths(paths: readonly (string | Path)[]): Path {
    return toPath(paths.join("."));
}

export function toPathSegments(path: Path): readonly string[] {
    return path[$path];
}

export function prependPath<T, U = T>(path: Path | undefined, value: T): U {
    if (path === undefined) {
        return value as any as U;
    } else {
        return writePath(path, {}, value) as any;
    }
}

export function writePath<T, U extends Record<string, any>>(path: Path, object: U, value: T): U {
    const segments = toPathSegments(path);
    let next = object as Record<string, any>;

    for (let i = 0; i < segments.length; ++i) {
        const segment = segments[i];

        if (i < segments.length - 1) {
            next = next[segment] ?? (next[segment] = {});
        } else {
            next[segment] = value;
        }
    }

    return object;
}

export function readPath<T = unknown>(path: Path | undefined, objects: readonly Record<string, any>[]): T[];
export function readPath<T = unknown>(path: Path | undefined, object: Record<string, any>): T | undefined;
export function readPath<T = unknown>(
    path: Path | undefined,
    objects: Record<string, any> | readonly Record<string, any>[],
): T[] | T | undefined {
    if (path === undefined) {
        return objects as T[] | T | undefined;
    } else if (Array.isArray(objects)) {
        let read: T[] = objects as T[];

        for (const segment of toPathSegments(path)) {
            read = read.flatMap(object => (object as any)[segment]).filter(isNotNullsy);
        }

        return read;
    } else {
        let object = objects as Record<string, any>;

        for (const segment of toPathSegments(path)) {
            object = object[segment];

            if (object === undefined) {
                return undefined;
            }
        }

        return object as T;
    }
}

export function assertValidPaths(paths: readonly Path[]): void {
    if (!paths.length) {
        throw new Error("paths can't be empty");
    }

    for (const path of paths) {
        for (const otherPath of paths.filter(candidate => candidate !== path)) {
            if (
                path.toString() === otherPath.toString() ||
                (path.includes(".") && path.startsWith(otherPath.toString()))
            ) {
                throw new Error("one path can't be contained in another");
            }
        }
    }
}
