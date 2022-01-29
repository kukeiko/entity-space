import { Null } from "./null";
import { Primitive } from "./types/primitive";

// [todo] there already is a method called "isPrimitive()" which takes value-type, not value, so this is confusing.
export function isPrimitiveOrNull<T extends Primitive | typeof Null>(
    value: unknown,
    valueTypes?: T[]
): value is ReturnType<T> {
    valueTypes = valueTypes ?? ([Number, String, Boolean, Null] as T[]);

    for (const valueType of valueTypes) {
        const typeValue = valueType();

        if ((typeValue === null && value === null) || typeof typeValue === typeof value) {
            return true;
        }
    }

    return false;
}
