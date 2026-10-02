import { Primitive, Unbox } from "@entity-space/utils";
import { Entity } from "../../entity/entity";

export type WhereEquals<T = any> = { $equals: T };
export type WhereNotEquals<T = any> = { $notEquals: T };
export type WhereInArray<T = any> = { $inArray: T[] };
export type WhereNotInArray<T = any> = { $notInArray: T[] };
export type WhereInRange<T = any> = { $inRange: [T | undefined, T | undefined] };

export type WherePrimitive<T = ReturnType<Primitive>> =
    | Partial<WhereEquals<T> & WhereNotEquals<T> & WhereInArray<T> & WhereNotInArray<T> & WhereInRange<T>>
    | T
    | T[];

export type WhereEntityProperty<T, U = Unbox<T>> =
    NonNullable<U> extends ReturnType<Primitive> ? WherePrimitive<U> : WhereEntity<U>;

export type WhereEntity<T = Entity> = { [K in keyof T]?: WhereEntityProperty<T[K]> };

function isObject(value: any): value is Record<string, any> {
    return value != null && typeof value === "object";
}

export function isWhereEquals(value: any): value is WhereEquals {
    return isObject(value) && (value as WhereEquals).$equals !== undefined;
}

export function isWhereNotEquals(value: any): value is WhereNotEquals {
    return isObject(value) && (value as WhereNotEquals).$notEquals !== undefined;
}

export function isWhereInArray(value: any): value is WhereInArray {
    return isObject(value) && (value as WhereInArray).$inArray !== undefined;
}

export function isWhereNotInArray(value: any): value is WhereNotInArray {
    return isObject(value) && (value as WhereNotInArray).$notInArray !== undefined;
}

export function isWhereInRange(value: any): value is WhereInRange {
    if (!isObject(value)) {
        return false;
    }

    const inRange = (value as WhereInRange).$inRange;

    return Array.isArray(inRange) && inRange.length === 2 && !(inRange[0] === undefined && inRange[1] === undefined);
}

export function isWhereEntity(value: any): value is WhereEntity {
    return isObject(value);
}

export function isWhereNever(value: any): boolean {
    if (Array.isArray(value) && !value.length) {
        return true;
    } else if (isWhereInArray(value) && !value.$inArray.length) {
        return true;
    }

    return false;
}
