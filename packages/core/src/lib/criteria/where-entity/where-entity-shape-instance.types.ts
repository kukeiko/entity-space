import { Null, Primitive, Unbox } from "@entity-space/utils";

type WherePrimitiveCommonShapeInstance<S> = S extends Record<"$equals", infer T>
    ? {
          $equals: T extends Primitive | typeof Null
              ? ReturnType<T>
              : T extends [Primitive | typeof Null]
              ? ReturnType<T[0]>[]
              : T extends (Primitive | typeof Null)[]
              ? ReturnType<T[number]>
              : T extends [(Primitive | typeof Null)[]]
              ? ReturnType<T[0][number]>[]
              : never;
      }
    : {};

type RangeInstanceHelper<T> = T extends typeof Number
    ? [number, number]
    : T extends typeof String
    ? [string, string]
    : never;

type WhereNumberOrStringShapeRangeOrBetweenInstance<S, K extends string> = S extends Record<K, infer T>
    ? T extends Primitive | typeof Null
        ? Record<K, [ReturnType<T>, ReturnType<T>]>
        : T extends (Primitive | typeof Null)[]
        ? Record<K, RangeInstanceHelper<T[number]>>
        : never
    : {};

type WhereNumberOrStringShapeGreaterOrLesserInstance<S, K extends string> = S extends Record<K, infer T>
    ? T extends Primitive | typeof Null
        ? Record<K, ReturnType<T>>
        : T extends (Primitive | typeof Null)[]
        ? Record<K, ReturnType<T[number]>>
        : never
    : {};

type WhereNumberOrStringShapeInstance<S> = WhereNumberOrStringShapeRangeOrBetweenInstance<S, "$range"> &
    WhereNumberOrStringShapeRangeOrBetweenInstance<S, "$between"> &
    WhereNumberOrStringShapeGreaterOrLesserInstance<S, "$greater"> &
    WhereNumberOrStringShapeGreaterOrLesserInstance<S, "$greaterEquals"> &
    WhereNumberOrStringShapeGreaterOrLesserInstance<S, "$lesser"> &
    WhereNumberOrStringShapeGreaterOrLesserInstance<S, "$lesserEquals">;

type WherePrimitiveSpecificShapeInstance<S> = WhereNumberOrStringShapeInstance<S>;

type WherePrimitiveSingleShapeOrInstance<S> = S extends Record<"$or", unknown[]>
    ? Record<"$or", WherePrimitiveSingleShapeInstance<S["$or"][number]>[]>
    : {};

type WherePrimitiveSingleShapeAndInstance<S> = S extends Record<"$and", unknown[]>
    ? Record<"$and", WherePrimitiveSingleShapeInstance<S["$and"][number]>[]>
    : {};

type WherePrimitiveSingleShapeInstance<S> = S extends Primitive | typeof Null
    ? ReturnType<S>
    : S extends [Primitive | typeof Null]
    ? ReturnType<S[0]>[]
    : S extends (Primitive | typeof Null)[]
    ? ReturnType<S[number]>
    : S extends [(Primitive | typeof Null)[]]
    ? ReturnType<S[0][number]>[]
    : WherePrimitiveCommonShapeInstance<S> &
          WherePrimitiveSpecificShapeInstance<S> &
          WherePrimitiveSingleShapeOrInstance<S> &
          WherePrimitiveSingleShapeAndInstance<S>;

type WherePrimitiveArrayShapeOrInstance<S> = S extends Record<"$or", unknown[]>
    ? Record<"$or", WherePrimitiveArrayShapeInstance<S["$or"][number]>[]>
    : {};

type WherePrimitiveArrayShapeAndInstance<S> = S extends Record<"$and", unknown[]>
    ? Record<"$and", WherePrimitiveArrayShapeInstance<S["$and"][number]>[]>
    : {};

type WherePrimitiveArrayShapeSomeInstance<S> = S extends Record<"$some", infer T>
    ? Record<"$some", WherePrimitiveSingleShapeInstance<T>>
    : {};

type WherePrimitiveArrayShapeEveryInstance<S> = S extends Record<"$every", infer T>
    ? Record<"$every", WherePrimitiveSingleShapeInstance<T>>
    : {};

type WherePrimitiveArrayShapeInstance<S> = S extends Primitive | typeof Null
    ? ReturnType<S>
    : S extends [Primitive | typeof Null]
    ? ReturnType<S[0]>[]
    : S extends (Primitive | typeof Null)[]
    ? ReturnType<S[number]>
    : S extends [(Primitive | typeof Null)[]]
    ? ReturnType<S[0][number]>[]
    : WherePrimitiveCommonShapeInstance<S> &
          WherePrimitiveSpecificShapeInstance<S> &
          WherePrimitiveArrayShapeOrInstance<S> &
          WherePrimitiveArrayShapeAndInstance<S> &
          WherePrimitiveArrayShapeSomeInstance<S> &
          WherePrimitiveArrayShapeEveryInstance<S>;

type WhereEntitySingleShapeOrInstance<T, S> = S extends Record<"$or", unknown[]>
    ? Record<"$or", WhereEntitySingleShapeInstance<T, S["$or"][number]>[]>
    : {};

type WhereEntitySingleShapeAndInstance<T, S> = S extends Record<"$and", unknown[]>
    ? Record<"$and", WhereEntitySingleShapeInstance<T, S["$and"][number]>[]>
    : {};

type WhereEntitySingleShapeInstance<T, S> = WhereEntityShapeInstance<T, S> &
    WhereEntitySingleShapeOrInstance<T, S> &
    WhereEntitySingleShapeAndInstance<T, S>;

type WhereEntityArrayShapeOrInstance<T, S> = S extends Record<"$or", unknown[]>
    ? Record<"$or", WhereEntityArrayShapeInstance<T, S["$or"][number]>[]>
    : {};

type WhereEntityArrayShapeAndInstance<T, S> = S extends Record<"$and", unknown[]>
    ? Record<"$and", WhereEntityArrayShapeInstance<T, S["$and"][number]>[]>
    : {};

type WhereEntityArrayShapeSomeInstance<T, S> = S extends Record<"$some", unknown>
    ? Record<"$some", WhereEntitySingleShapeInstance<T, S["$some"]>>
    : {};

type WhereEntityArrayShapeEveryInstance<T, S> = S extends Record<"$every", unknown>
    ? Record<"$every", WhereEntitySingleShapeInstance<T, S["$every"]>>
    : {};

type WhereEntityArrayShapeInstance<T, S> = WhereEntityShapeInstance<T, S> &
    WhereEntityArrayShapeOrInstance<T, S> &
    WhereEntityArrayShapeAndInstance<T, S> &
    WhereEntityArrayShapeSomeInstance<T, S> &
    WhereEntityArrayShapeEveryInstance<T, S>;

type WhereEntityPropertyShapeInstance<
    T,
    S,
    U = Exclude<T, undefined | null>,
    V = Unbox<Exclude<T, undefined | null>>
> = Unbox<U> extends ReturnType<Primitive | typeof Null>
    ? U extends unknown[]
        ? WherePrimitiveArrayShapeInstance<S>
        : WherePrimitiveSingleShapeInstance<S>
    : U extends unknown[]
    ? WhereEntityArrayShapeInstance<V, S>
    : WhereEntitySingleShapeInstance<V, S>;

type WhereEntityShapeInstanceRequired<T, S> = {
    [K in keyof (T | S)]-?: WhereEntityPropertyShapeInstance<T[K], S[K]>;
};

type WhereEntityShapeInstanceOptional<T, S> = S extends Record<"$optional", unknown>
    ? {
          [K in keyof (T | S["$optional"])]?: Partial<WhereEntityPropertyShapeInstance<T[K], S["$optional"][K]>>;
      }
    : {};

export type WhereEntityShapeInstance<T, S> = WhereEntityShapeInstanceRequired<T, S> &
    WhereEntityShapeInstanceOptional<T, S>;
