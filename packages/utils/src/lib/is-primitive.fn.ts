import { isPrimitiveOrNull } from "./is-primitive-or-null-value.fn";
import { Primitive } from "./types";

export function isPrimitive(x?: any): x is Primitive {
    return x === Boolean || x === Number || x === String;
}

export function isPrimitiveValue(value: unknown): value is ReturnType<Primitive> {
    return isPrimitiveOrNull(value, [Boolean, Number, String]);
}
