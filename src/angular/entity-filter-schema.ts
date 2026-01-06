import { Entity, EntityBlueprint, getNamedProperties, hasAttribute, NamedProperty } from "@entity-space/elements";
import { Class } from "@entity-space/utils";
import { Observable } from "rxjs";

function toOptionalInteger(value?: string): number | undefined {
    if (value == null) {
        return undefined;
    }

    const int = parseInt(value);

    return isNaN(int) ? undefined : int;
}

function toNullableInteger(value?: string): number | null {
    if (value == null) {
        return null;
    }

    const int = parseInt(value);

    return isNaN(int) ? null : int;
}

function toIntegerArray(value?: string): number[] {
    return (value ?? "")
        .split(",")
        .filter(str => str.length)
        .map(str => parseInt(str))
        .filter(number => !isNaN(number));
}

function toStringArray(value?: string): string[] {
    return (value ?? "").split(",").filter(str => str.length);
}

function toOptionalBoolean(value?: string): boolean | undefined {
    const str = (value ?? "").toLocaleLowerCase();

    if (str === "true") {
        return true;
    } else if (str === "false") {
        return false;
    } else {
        return undefined;
    }
}

function toNullableBoolean(value?: string): boolean | null {
    const str = (value ?? "").toLocaleLowerCase();

    if (str === "true") {
        return true;
    } else if (str === "false") {
        return false;
    } else {
        return null;
    }
}

function toOptionalString(value?: string): string | undefined {
    if (value == null) {
        return undefined;
    } else {
        return value;
    }
}

function toNullableString(value?: string): string | null {
    if (value == null) {
        return null;
    } else {
        return value;
    }
}

function toParam(value?: number | string | boolean | (number | string | boolean)[] | null): string | undefined {
    if (typeof value === "number" && !isNaN(value)) {
        return value.toString();
    } else if (typeof value === "string") {
        return value;
    } else if (typeof value === "boolean") {
        return JSON.stringify(value);
    } else if (Array.isArray(value) && value.length) {
        return value.join(",");
    } else {
        return undefined;
    }
}

export interface EntityFilterSchemaProperty<V = any> {
    parse: (value?: string) => V;
    stringify: (value?: V) => string | undefined | null;
}

export type EntityFilterSchema<T = any> = {
    [K in keyof T]-?: EntityFilterSchemaProperty<T[K]>;
};

export interface EntityFilterSource<T> {
    getFilter$(): Observable<T>;
    patchFilter(patch: Partial<T>): void;
}

function toEntityFilterSchemaProperty(property: NamedProperty): EntityFilterSchemaProperty {
    const stringify: EntityFilterSchemaProperty["stringify"] = toParam;
    let parse: EntityFilterSchemaProperty["parse"];

    const errorMessagePrefix = `can't create filter schema for property "${property.name}"`;
    const isNullable = hasAttribute("nullable", property);
    const isArray = hasAttribute("array", property);
    const isUnion = hasAttribute("union", property);

    if (property.valueType === Number) {
        if (isArray) {
            parse = toIntegerArray;
        } else if (isNullable) {
            parse = toNullableInteger;
        } else {
            parse = toOptionalInteger;
        }
    } else if (property.valueType === String) {
        if (isArray) {
            parse = toStringArray;
        } else if (isNullable) {
            parse = toNullableString;
        } else {
            parse = toOptionalString;
        }
    } else if (property.valueType === Boolean) {
        if (isArray) {
            throw new Error(`${errorMessagePrefix}: boolean arrays not yet supported`);
        } else if (isNullable) {
            parse = toNullableBoolean;
        } else {
            parse = toOptionalBoolean;
        }
    } else if (isUnion) {
        if (isArray) {
            parse = toStringArray;
        } else if (isNullable) {
            parse = toNullableString;
        } else {
            parse = toOptionalString;
        }
    } else {
        throw new Error(`${errorMessagePrefix}: unsupported value type`);
    }

    return { parse, stringify };
}

export function createEntityFilterSchema<B>(blueprint: Class<B>): EntityFilterSchema<EntityBlueprint.Type<B>> {
    const schema: EntityFilterSchema<Entity> = {};
    const properties = getNamedProperties(blueprint);

    for (const property of properties) {
        const name = property.name;
        schema[name] = toEntityFilterSchemaProperty(property);
    }

    return schema as EntityFilterSchema<EntityBlueprint.Type<B>>;
}
