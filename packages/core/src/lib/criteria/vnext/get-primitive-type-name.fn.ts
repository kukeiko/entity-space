import { Null, Primitive } from "@entity-space/utils";

export function getPrimitiveTypeName(type: Primitive | typeof Null): string {
    if (type === Null) {
        return "null";
    } else if (type === Number) {
        return "number";
    } else if (type === String) {
        return "string";
    } else if (type === Boolean) {
        return "boolean";
    } else {
        throw new Error(`unexpected value type ${type}`);
    }
}
