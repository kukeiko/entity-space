import { Primitive, Unbox } from "@entity-space/utils";
import { Entity } from "../../entity/entity";

type WhereEquals<T> = { $equals: T };
type WhereNotEquals<T> = { $notEquals: T };
type WhereInArray<T> = { $inArray: T[] };
type WhereNotInArray<T> = { $notInArray: T[] };
export type WhereInRange<T> = { $inRange: [T | undefined, T | undefined] };

type WherePrimitive<T> =
    | T
    | T[]
    | Partial<WhereEquals<T> & WhereNotEquals<T> & WhereInArray<T> & WhereNotInArray<T> & WhereInRange<T>>;

type WhereEntityProperty<T, U = Unbox<T>> =
    NonNullable<U> extends ReturnType<Primitive> ? WherePrimitive<U> : WhereEntity<U>;

export type WhereEntity<T = Entity> = { [K in keyof T]?: WhereEntityProperty<T[K]> };
