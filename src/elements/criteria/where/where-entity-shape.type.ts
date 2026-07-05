import { Primitive, Unbox } from "@entity-space/utils";
import { Entity } from "../../entity/entity";

export type WhereEqualsShape = { $equals: true };
export type WhereNotEqualsShape = { $notEquals: true };
export type WhereInArrayShape = { $inArray: true };
export type WhereNotInArrayShape = { $notInArray: true };
export type WhereInRangeShape = { $inRange: true };

export type WherePrimitiveShape = Partial<
    WhereEqualsShape &
        WhereNotEqualsShape &
        WhereInArrayShape &
        WhereNotInArrayShape &
        WhereInRangeShape & { $optional: true }
>;

type WhereEntityShapeProperty<T, U = Unbox<T>> =
    NonNullable<U> extends ReturnType<Primitive> ? WherePrimitiveShape : WhereEntityShape<U>;

export type WhereEntityShape<T = Entity> = { [K in keyof T]?: WhereEntityShapeProperty<T[K]> };

export function isWherePrimitiveShape(
    shape: Partial<WherePrimitiveShape> | WhereEntityShape,
): shape is Partial<WherePrimitiveShape> {
    const keys: (keyof WherePrimitiveShape)[] = ["$equals", "$inArray", "$inRange", "$notEquals", "$notInArray"];

    return keys.some(key => shape[key] === true);
}
