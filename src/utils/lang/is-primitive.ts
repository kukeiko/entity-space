import { Primitive } from "./primitive";

export function isPrimitive(x?: any): x is Primitive {
    return x === Boolean || x === Number || x === String;
}
