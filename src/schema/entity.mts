import { isPlainObject } from "lodash";

export type Entity = Record<string, any>;

export function isEntity(value: unknown): value is Entity {
    return isPlainObject(value);
}
