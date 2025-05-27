export const Null = () => null;
export const Undefined = () => undefined;
export type Primitive = typeof Boolean | typeof Number | typeof String | typeof Null | typeof Undefined;

export function primitiveToString(value: ReturnType<Primitive>): string {
    if (value === null) {
        return "null";
    } else if (value === undefined) {
        return "undefined";
    } else if (typeof value === "string") {
        return `"${value}"`;
    }

    return value.toString();
}

export function primitiveToType(value: ReturnType<Primitive>): Primitive {
    if (value === null) {
        return Null;
    } else if (value === undefined) {
        return Undefined;
    } else if (typeof value === "string") {
        return String;
    } else if (typeof value === "number") {
        return Number;
    } else if (typeof value === "boolean") {
        return Boolean;
    } else {
        throw new Error(`value ${value} is not a primitive value`);
    }
}

export function isPrimitiveType(value: unknown): value is Primitive {
    return ([Number, String, Boolean, Null, Undefined] as unknown[]).includes(value);
}

export function isPrimitive(value: unknown): value is ReturnType<Primitive> {
    return isPrimitiveOfType([Number, String, Boolean, Null, Undefined])(value);
}

export function isPrimitiveOfType(types: readonly Primitive[]): (value: unknown) => value is Primitive {
    return (value: unknown): value is Primitive => {
        const check = (valueType: Primitive) => {
            const typeValue = valueType();

            if (typeValue === null) {
                return value === null;
            } else if (typeValue === undefined) {
                return value === undefined;
            } else {
                return typeof typeValue === typeof value;
            }
        };

        return types.some(check);
    };
}

export function primitiveTypeToString(type: Primitive): string {
    if (type === Null) {
        return "null";
    } else if (type === Undefined) {
        return "undefined";
    } else if (type === Number) {
        return "number";
    } else if (type === String) {
        return "string";
    } else if (type === Boolean) {
        return "boolean";
    } else {
        throw new Error(`type ${type} is not a Primitive`);
    }
}
