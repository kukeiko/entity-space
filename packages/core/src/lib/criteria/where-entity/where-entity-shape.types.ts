import { Distribute, Null, Primitive, Unbox } from "@entity-space/utils";
import { Entity } from "../../common/entity.type";

type WhereNumberOrStringShape<T, D = Distribute<T>> = {
    $range?: T | D[];
    $between?: T | D[];
    $greater?: T | D[];
    $greaterEquals?: T | D[];
    $lesser?: T | D[];
    $lesserEquals?: T | D[];
};

type PrimitiveValueToType<T> = T extends boolean
    ? typeof Boolean
    : T extends string
    ? typeof String
    : T extends number
    ? typeof Number
    : never;

type WherePrimitiveShorthandShape<T> =
    | T // equals (e.g. number)
    | [T] // in-array (e.g. number[])
    | T[] // equals (multiple primitive types) (e.g. number|string)
    | [T[]]; // in-array (multiple primitive types) (e.g. (number|string)[]);

type WherePrimitiveCommonShape<T> = {
    $equals?: T | T[] | [T] | [T[]]; // T = equals, T[] = equals (multiple primitive types), [T] = in-array, [T[]] = in-array (multiple primitive types)
};

type WherePrimitiveSpecificShape<T, D = Distribute<T>> = T extends typeof String | typeof Number
    ? WhereNumberOrStringShape<Exclude<D, typeof Boolean>>
    : {};

type WherePrimitiveShape<T> =
    | WherePrimitiveShorthandShape<T>
    | (WherePrimitiveCommonShape<T> & WherePrimitiveSpecificShape<T>);

// [todo] "WherePrimitiveShape<T>" can be shorthand shape, so "&" is not a good idea here
type WherePrimitiveSingleShape<T> = WherePrimitiveShape<T> & {
    $and?: WherePrimitiveSingleShape<T>[];
    $or?: WherePrimitiveSingleShape<T>[];
};

type WherePrimitiveArrayShape<T> = WherePrimitiveShape<T> & {
    $and?: WherePrimitiveArrayShape<T>[];
    $or?: WherePrimitiveArrayShape<T>[];
    $some?: WherePrimitiveSingleShape<T>;
    $every?: WherePrimitiveSingleShape<T>;
};

type WhereEntitySingleShape<T> = WhereEntityShape<T> & {
    $and?: WhereEntitySingleShape<T>[];
    $or?: WhereEntitySingleShape<T>[];
};

type WhereEntityArrayShape<T> = WhereEntityShape<T> & {
    $and?: WhereEntitySingleShape<T>[];
    $or?: WhereEntitySingleShape<T>[];
    $some?: WhereEntityShape<T>;
    $every?: WhereEntityShape<T>;
};

type WhereEntityPropertyShape<
    T,
    U = Exclude<T, undefined | null>,
    V = Unbox<Exclude<T, undefined | null>>
> = Unbox<U> extends ReturnType<Primitive | typeof Null>
    ? U extends unknown[]
        ? WherePrimitiveArrayShape<PrimitiveValueToType<V>>
        : WherePrimitiveSingleShape<PrimitiveValueToType<V>>
    : U extends unknown[]
    ? WhereEntityArrayShape<V>
    : WhereEntitySingleShape<V>;

export type WhereEntityShape<T = Entity> = {
    [K in keyof T]?: WhereEntityPropertyShape<T[K]>;
} & { $optional?: { [K in keyof T]?: WhereEntityPropertyShape<T[K]> } };
