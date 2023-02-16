import { Distribute, Null, Primitive, Unbox } from "@entity-space/utils";
import { Entity } from "../common/entity.type";
import { BlueprintInstance } from "../schema/blueprint-instance";
import { FooBlueprint, TypeA_Blueprint, TypeB_Blueprint } from "./test-models";

describe("playground: criteria v3", () => {
    type Foo = BlueprintInstance<FooBlueprint>;

    xit("EntityWhere<T> #3", () => {
        type WhereNumberOrString<T> = {
            $range?: [T | undefined, T | undefined];
            $between?: [T | undefined, T | undefined];
            $greater?: T;
            $greaterEquals?: T;
            $lesser?: T;
            $lesserEquals?: T;
        };

        // [todo] if we allow "$equals: T[]", which maps to in-array, we have a potential source of confusion
        // when it is used on an array of primitives - you would expect the array to perfectly equal
        // the array in the criterion, but since it is "in-array", it would only do an intersection check instead.
        type WherePrimitive<T> = {
            $equals?: T | T[];
            $or?: WherePrimitive<T>[];
            $and?: WherePrimitive<T>[];
        } & (T extends number ? { $odd?: boolean; $even?: boolean } : {}) &
            (T extends number | string ? WhereNumberOrString<T> : {});

        type WherePrimitiveArray<T extends unknown[]> = {
            $some?: WherePrimitive<T[number]>;
            $every?: WherePrimitive<T[number]>;
            $or?: (WherePrimitiveArray<T> | WherePrimitive<T[number]>)[];
            $and?: WherePrimitiveArray<T>[];
        } & WherePrimitive<T[number]>;

        type WhereEntityArray<T extends unknown[]> = {
            $some?: WhereEntity<T[number]>;
            $every?: WhereEntity<T[number]>;
            $or?: WhereEntityArray<T>[];
            $and?: WhereEntityArray<T>[];
        } & WhereEntity<T[number]>;

        // [todo] make sure we really dont need D = Distribute<U>
        // type WhereEntityProperty<T, U = Unbox<T>, D = Distribute<U>> = Unbox<T> extends ReturnType<
        // [todo] if i keep the () => undefined, maybe it would make sense to introduce it like i did with "Null"?
        type WhereEntityProperty<T, U = Unbox<T>> = Unbox<T> extends ReturnType<
            Primitive | typeof Null | (() => undefined)
        >
            ? (Exclude<U, undefined> | U[]) | (T extends unknown[] ? WherePrimitiveArray<T> : WherePrimitive<U>)
            : T extends unknown[]
            ? WhereEntityArray<T>
            : U extends null
            ? null | WhereEntity<U>
            : WhereEntity<U>;

        // [todo] do we want to be able to filter entities where bar === void 0?
        // if yes, there currently is no way to express it.
        // one option would be to introduce "$isUndefined" (at which point we should also add "$isNull")
        type WhereEntity<T> = {
            [K in keyof T]?: WhereEntityProperty<T[K]>;
        } & {
            $or?: { [K in keyof T]?: WhereEntityProperty<T[K]>[] };
            $and?: { [K in keyof T]?: WhereEntityProperty<T[K]>[] };
        };

        const foo: Foo = {
            id: 0,
            name: "",
            numbers: [],
            primitive: null,
            primitives: null,
            bar: {
                baz: [],
                fooId: 0,
                id: 0,
                name: null,
                primitives: [1, true, "2"],
            },
        };

        function whereFoo(where: WhereEntity<Foo>): void {}

        whereFoo({
            id: { $equals: [1, 3] },
            bar: null,
            primitive: [true, false, 1, "foo", void 0],
            primitives: {
                $range: ["a", "z"],
                // [todo] $every doesn't work here yet because of anding together the WherePrimitiveArray type with the WherePrimitive type,
                // anding together is causing an intersection and that intersection doesn't have "$every"
                // $or: [{ $every: { $equals: [1, "a"] } }],
            },
        });

        whereFoo({
            id: 7,
            bar: {
                name: { $between: ["a", "z"] },
                fooId: 3,
                baz: {
                    $or: [{}],
                    $every: { barId: [1, 2], nullsyNumber: [1, void 0, null] },
                },
            },
            name: { $lesser: "abc", $or: [{ $between: ["a", "z"] }, { $between: ["A", "Z"], $equals: "foo" }] },
            primitive: {
                $range: [1, 2],
                // $range: [1, 2],
                $between: ["a", "z"],
                $equals: [1, "2", null, true, void 0],
                $or: [{ $range: ["", ""], $equals: [1, "2", null] }],
            },
            // primitives: {
            //     $some: {},
            // },
            primitives: {
                $range: [1, 2],
                $every: { $odd: true, $equals: ["3", 2, false] },
            },
            // numbers: {
            //     $every: {
            //         $and: [],
            //         $or: [
            //             { $even: false, $range: [1, 3] },
            //             { $even: true, $greater: 7 },
            //         ],
            //     },
            //     $equals: [1, 2, 3],
            // },
            // bar: { id: 3, $equals: null, primitives: {} },
        });
    });

    xit("EntityCriteriaShape vnext-#2", () => {
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

        type WhereEntityShape<T> = {
            [K in keyof T]?: WhereEntityPropertyShape<T[K]>;
        } & { $optional?: { [K in keyof T]?: WhereEntityPropertyShape<T[K]> } };

        function takesFooShape(...shapes: WhereEntityShape<Foo>[]): void {}

        takesFooShape(
            {
                id: [Number],
                primitive: [String, Number],
                primitives: [String, Number],
                boolean: {},
                barOrBaz: {
                    fooId: [Number],
                    nullsyNumber: Number,
                    $or: [
                        {
                            fooId: [Number],
                            nullsyNumber: Number,
                        },
                    ],
                },
                $optional: {
                    primitives: {
                        $equals: [Boolean, Number],
                        $range: [String],
                        $some: { $range: [String], $or: [{ $and: [{ $between: [String, Number] }] }] },
                        $every: Number,
                    },
                },
            },
            {
                id: {
                    $equals: Number,
                },
                primitive: {
                    $equals: [Number, Boolean],
                    $and: [{ $equals: [Number, String] }],
                },
                primitives: {
                    $equals: [Boolean, Number],
                    $range: [String],
                    $some: { $range: [String], $or: [{ $and: [{ $between: [String, Number] }] }] },
                    $every: Number,
                },
            }
        );

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
                  [K in keyof (T | S["$optional"])]?: Partial<
                      WhereEntityPropertyShapeInstance<T[K], S["$optional"][K]>
                  >;
              }
            : {};

        type WhereEntityShapeInstance<T, S> = WhereEntityShapeInstanceRequired<T, S> &
            WhereEntityShapeInstanceOptional<T, S>;

        function takesSingleFooShape<S extends WhereEntityShape<Foo>>(shape: S | WhereEntityShape<Foo>): S {
            return shape as S;
        }

        // [todo] can provide Boolean in places where it shouldn't be possible, e.g. primitive: { $range: Boolean }
        // reason is that it takes "S | WhereEntityShape<Foo>" as the "shape" argument, which is required for "find-references"
        // on entity properties. it does though correctly work for e.g. id: { id: Boolean } does not work.
        // so either
        // A: allow everything, which potentially would make the Shape types less complex, or
        // B: fix it somehow, or
        // C: keep it as a bug
        const shape = takesSingleFooShape({
            id: Number,
            name: { $equals: String },
            bar: {
                description: String,
                $or: [{ id: Number, name: String, baz: { nullsyNumber: Number } }],
                baz: { $every: { level: Number } },
            },
            primitive: {
                $equals: [Number, String, Boolean],
                $range: [String, Number],
                $greater: String,
                $greaterEquals: [String, Number],
                $or: [{ $range: [String, Number] }, { $equals: Boolean }],
            },
            primitives: {
                $range: [String, Number],
                $and: [{ $and: [{ $equals: Number, $every: { $equals: [String, Number] } }] }],
            },
            $optional: {
                boolean: Boolean,
                name: { $between: String },
                bar: {
                    baz: {},
                },
            },
        });

        function fooShapeToInstance<S>(shape: S): WhereEntityShapeInstance<Foo, S> {
            return {} as any;
        }

        const {
            id,
            name: { $equals, $between },
            primitive,
            primitives: { $range: primitivesRange, $and: primitivesAnd },
            boolean,
            bar,
        } = fooShapeToInstance(shape);

        const foo = primitive.$or[0];

        if ("$equals" in foo) {
            foo.$equals;
        }

        primitivesAnd[0].$and[0].$every.$equals;
        bar.$or[0].name;
        bar.baz.$every.level;
    });

    // xdescribe("testing non-prototype stuff", () => {
    //     const fooSchema: IEntitySchema<Foo> = {} as any;
    //     const shape = EntityCriteriaShape.create(fooSchema, { [$required]: { id: Number } });
    //     const value = shape.read({} as any);
    // });

    xit("improve WhereEntity", () => {
        type WhereNumberOrString<T> = {
            $range?: [T | undefined, T | undefined];
            $between?: [T | undefined, T | undefined];
            $greater?: T;
            $greaterEquals?: T;
            $lesser?: T;
            $lesserEquals?: T;
        };

        type WherePrimitiveShorthand<T> = T | T[];

        // [todo] if we allow "$equals: T[]", which maps to in-array, we have a potential source of confusion
        // when it is used on an array of primitives - you would expect the array to perfectly equal
        // the array in the criterion, but since it is "in-array", it would only do an intersection check instead.
        type WherePrimitiveCommon<T> = {
            $equals?: T | T[];
        };

        type WherePrimitiveSpecific<T> = T extends string | number
            ? WhereNumberOrString<Exclude<T, typeof Boolean>>
            : {};

        type WherePrimitiveSingle<T> =
            | WherePrimitiveShorthand<T>
            | (WherePrimitiveCommon<T> &
                  WherePrimitiveSpecific<T> & {
                      $and?: WherePrimitiveSingle<T>[];
                      $or?: WherePrimitiveSingle<T>;
                  });

        type WherePrimitiveArray<T> =
            | WherePrimitiveShorthand<T>
            | (WherePrimitiveCommon<T> &
                  WherePrimitiveSpecific<T> & {
                      $and?: WherePrimitiveArray<T>[];
                      $or?: WherePrimitiveArray<T>[];
                      $some?: WherePrimitiveArray<T>;
                      $every?: WherePrimitiveArray<T>;
                  });

        type WhereEntitySingle<T> = WhereEntity<T> & {
            $and?: WhereEntitySingle<T>[];
            $or?: WhereEntitySingle<T>[];
        };

        type WhereEntityArray<T> = WhereEntity<T> & {
            $and?: WhereEntityArray<T>[];
            $or?: WhereEntityArray<T>[];
            $some?: WhereEntityArray<T>;
            $every?: WhereEntityArray<T>;
        };

        // [todo] make sure we really dont need D = Distribute<U>
        // type WhereEntityProperty<T, U = Unbox<T>, D = Distribute<U>> = Unbox<T> extends ReturnType<
        // [todo] if i keep the () => undefined, maybe it would make sense to introduce it like i did with "Null"?
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

        interface A {
            type: "A";
        }

        interface B {
            type: "B";
        }

        // type Testitest = WhereEntity<BlueprintInstance<TypeA_Blueprint | TypeB_Blueprint>>;
        type Testitest = WhereEntityProperty<
            BlueprintInstance<TypeA_Blueprint>["type"] | BlueprintInstance<TypeB_Blueprint>["type"]
        >;

        const testitest: Testitest = ["A", "B"];

        const barCriteria: WhereEntity<A | B> = {};

        const criteria: WhereEntity<Foo> = {
            id: 3,
            primitive: [1, true],
            types: {
                number: 3,
                string: "",

                type: ["A", "B"],
                sameNameDifferentType: [1, "2"],
            },
            bar: null,
            // bar: {
            //     id: 3,

            //     // primitives: {
            //     //     $range: [1, 1],
            //     // },
            //     types: { $some: { type: ["A", "B"] } },
            // },
        };
    });
});
