import { flatten } from "lodash";
import { isDefined } from "./is-defined.fn";

export function readPath<T>(path: string, object: Record<string, any>): T | undefined {
    if (path === "") return object as T;

    for (const segment of path.split(".")) {
        object = object[segment];

        if (object === void 0) {
            return object;
        }
    }

    return object as T;
}

// [todo] would instead like to just have one method, "readPath()" - but don't yet know how to do it
export function readPathOnObjects<T>(path: string[], objects: Record<string, any>[]): T[] {
    let read: T[] = objects as T[];

    if (!path.length) {
        return read;
    }

    for (const segment of path) {
        read = flatten(objects.map(object => object[segment]).filter(isDefined));
    }

    return read;
}
