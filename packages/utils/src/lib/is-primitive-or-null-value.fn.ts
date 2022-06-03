import { Null } from "./null";
import { Primitive, PrimitiveIncludingNull } from "./types";

// [todo] there already is a method called "isPrimitive()" which takes value-type, not value, so this is confusing.
export function isPrimitiveOrNull<T extends Primitive | typeof Null>(
    value: unknown,
    valueTypes?: T[]
): value is ReturnType<T> {
    valueTypes = valueTypes ?? ([Number, String, Boolean, Null] as T[]);

    for (const valueType of valueTypes) {
        const typeValue = valueType();

        if (typeValue === null) {
            if (value === null) {
                return true;
            }
        } else if (typeof typeValue === typeof value) {
            return true;
        }
    }

    return false;
}

// [todo] had to introduce so it can be passed to Array.every/filter/...
export function isPrimitiveOrNullNoCustomArg(value: unknown): value is ReturnType<PrimitiveIncludingNull> {
    return isPrimitiveOrNull(value);
}
