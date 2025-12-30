export const Null = () => null;
export const Undefined = () => undefined;

const $enumPrimitive: unique symbol = Symbol();
const $enumPrimitiveValues: unique symbol = Symbol();

export type EnumPrimitive<T> = (() => T) & { readonly [$enumPrimitive]: true; readonly [$enumPrimitiveValues]: Set<T> };

export function isEnumPrimitive(primitive: unknown): primitive is EnumPrimitive<string> {
    return primitive != null && (primitive as any)[$enumPrimitive] === true;
}

export type Primitive =
    | typeof Boolean
    | typeof Number
    | typeof String
    | typeof Null
    | typeof Undefined
    | EnumPrimitive<string>;

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

export function isPrimitiveType(value: any): value is Primitive {
    return value?.[$enumPrimitive] === true || [Number, String, Boolean, Null, Undefined].includes(value);
}

export function isPrimitive(value: any): value is ReturnType<Primitive> {
    return isPrimitiveOfType([Number, String, Boolean, Null, Undefined])(value);
}

export function isPrimitiveOfType(types: readonly Primitive[]): (value: unknown) => value is Primitive {
    return (value: unknown): value is Primitive => {
        const check = (primitive: Primitive) => {
            const expectedValue = primitive();

            if (isEnumPrimitive(primitive)) {
                return primitive[$enumPrimitiveValues].has(value as any);
            } else if (expectedValue === null) {
                return value === null;
            } else if (expectedValue === undefined) {
                return value === undefined;
            } else {
                return typeof expectedValue === typeof value;
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
    } else if ((type as any)[$enumPrimitive] === true) {
        return "enum";
    } else {
        throw new Error(`type ${type} is not a Primitive`);
    }
}

export function enumToPrimitive<T extends Record<string, string>>(enum_: T): EnumPrimitive<string> {
    const primitive = () => enum_[Object.keys(enum_)[0]];
    primitive[$enumPrimitive] = true;
    primitive[$enumPrimitiveValues] = new Set<string>(Object.values(enum_));

    return primitive as EnumPrimitive<string>;
}
