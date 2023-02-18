import { Null, Primitive } from "@entity-space/utils";
import { Entity } from "../../common/entity.type";

export type WhereNumberOrString<T> = {
    $range?: [T | undefined, T | undefined];
    $between?: [T | undefined, T | undefined];
    $greater?: T;
    $greaterEquals?: T;
    $lesser?: T;
    $lesserEquals?: T;
};

export type WherePrimitiveShorthand<T> = T | T[];

// [todo] if we allow "$equals: T[]", which maps to in-array, we have a potential source of confusion
// when it is used on an array of primitives - you would expect the array to perfectly equal
// the array in the criterion, but since it is "in-array", it would only do an intersection check instead.
export type WherePrimitiveCommon<T> = {
    $equals?: T | T[];
};

type WherePrimitiveSpecific<T> = T extends string | number ? WhereNumberOrString<Exclude<T, typeof Boolean>> : {};

export type WherePrimitiveSingle<T> =
    | WherePrimitiveShorthand<T>
    | (WherePrimitiveCommon<T> &
          WherePrimitiveSpecific<T> & {
              $and?: WherePrimitiveSingle<T>[];
              $or?: WherePrimitiveSingle<T>[];
          });

export type WherePrimitiveArray<T> =
    | WherePrimitiveShorthand<T>
    | (WherePrimitiveCommon<T> &
          WherePrimitiveSpecific<T> & {
              $and?: WherePrimitiveArray<T>[];
              $or?: WherePrimitiveArray<T>[];
              $some?: WherePrimitiveSingle<T>;
              $every?: WherePrimitiveSingle<T>;
          });

export type WhereEntitySingle<T = Entity> = WhereEntity<T> & {
    $and?: WhereEntitySingle<T>[];
    $or?: WhereEntitySingle<T>[];
};

export type WhereEntityArray<T> = WhereEntity<T> & {
    $and?: WhereEntityArray<T>[];
    $or?: WhereEntityArray<T>[];
    $some?: WhereEntitySingle<T>;
    $every?: WhereEntitySingle<T>;
};

// [todo] I added the wrapping in tuple - i.e. [U] - in a haste, maybe we only need that in the WhereEntity type.
// to see if we need it, we just need to check that criteria on related entity unions works
type WhereEntityProperty<T, U = Exclude<T, undefined | null>> =
    | ([U] extends [ReturnType<Primitive | typeof Null>]
          ? [U] extends [unknown[]]
              ? WherePrimitiveArray<U[number]>
              : WherePrimitiveSingle<U>
          : [U] extends [unknown[]]
          ? WhereEntityArray<[U][0][number]>
          : WhereEntitySingle<[U][0]>)
    | (T extends null ? null : never);

// [todo] do we want to be able to filter entities where bar === void 0?
// if yes, there currently is no way to express it.
// one option would be to introduce "$isUndefined" (at which point we should also add "$isNull")
type WhereEntity<T = Entity, U extends [T] = [T]> =
    | {
          [K in keyof U[0]]?: WhereEntityProperty<U[0][K]>;
      }
    | { [K in keyof T]?: WhereEntityProperty<T[K]> };
