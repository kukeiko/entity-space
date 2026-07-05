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
