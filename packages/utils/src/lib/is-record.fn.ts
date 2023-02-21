import { isPlainObject } from "lodash";

export function isRecord(value: unknown): value is Record<string, unknown> {
    // [todo] potentially not fully correct to use "isPlainObject()" from lodash,
    // as something like "Map" also satisfied the Record<string, unknown> constraint.
    return isPlainObject(value);
}
