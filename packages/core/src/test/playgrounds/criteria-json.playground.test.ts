import { isPrimitive, Null, Primitive, Unbox } from "@entity-space/utils";
import { BlueprintInstance } from "../../lib/common/schema/blueprint-instance";
import { define } from "../../lib/common/schema/blueprint-property";
import { ICriterionShape } from "../../lib/criteria/templates/criterion-shape.interface";
import { inRangeShape } from "../../lib/criteria/templates/in-range-shape.fn";
import { inSetShape } from "../../lib/criteria/templates/in-set-shape.fn";
import { isValueShape } from "../../lib/criteria/templates/is-value-shape.fn";
import { NamedCriteriaShapeItems } from "../../lib/criteria/templates/named-criteria-shape";
import { namedShape } from "../../lib/criteria/templates/named-shape.fn";

describe("playground: criteria-json", () => {
    type PrimitiveType = boolean | number | null | string;

    type PrimitiveCriteria<T> =
        | {
              in?: T[];
              inRange?: [T | undefined, T | undefined];
              minValue?: T;
              maxValue?: T;
          }
        | T // equals
        | T[] // in-array/in-set
        | [T | undefined, T | undefined]; // in-range

    type ArrayCriteria<T> = {
        every?: T extends PrimitiveType ? PrimitiveCriteria<T> : EntityCriteria<T>;
        some?: T extends PrimitiveType ? PrimitiveCriteria<T> : EntityCriteria<T>;
        empty?: boolean;
        length?: PrimitiveCriteria<number>;
    };

    type EntityCriteria<T> = {
        [K in keyof T]?: T extends Array<infer U>
            ? U extends PrimitiveType
                ? PrimitiveCriteria<U> | ArrayCriteria<U>
                : EntityCriteria<U> | ArrayCriteria<U>
            : T extends PrimitiveType
            ? PrimitiveCriteria<T>
            : EntityCriteria<T>;
    };

    // ---

    type PrimitiveCriteriaJsonShape<T extends Primitive | typeof Null = Primitive | typeof Null> =
        | {
              equals?: T | T[];
              inArray?: T | T[];
              inRange?: T | T[];
          }
        | T // equals
        | T[] // equals (multiple primitive types)
        | [T] // in-array
        | [T[]] // in-array (multiple primitive types)
        | [T, T]; // in-range

    type ArrayCriteriaJsonShape<T> = {
        every?: T;
        some?: T;
        empty?: boolean;
        length?: PrimitiveCriteria<number>;
    };

    type EntityCriteriaJsonShape<T> = {
        [K in keyof T]?: Unbox<T[K]> extends ReturnType<Primitive | typeof Null>
            ? T[K] extends any[]
                ? ArrayCriteriaJsonShape<PrimitiveCriteriaJsonShape> | PrimitiveCriteriaJsonShape
                : PrimitiveCriteriaJsonShape
            : EntityCriteriaJsonShape<Unbox<T[K]>>;
        // [K in keyof T]?: PrimitiveCriteriaShape | EntityCriteriaShape<T[K]>;
    };

    type CriteriaJsonShape = PrimitiveCriteriaJsonShape | ArrayCriteriaJsonShape<any> | EntityCriteriaJsonShape<any>;

    function isPrimitiveCriteriaJsonShape(value: unknown): value is PrimitiveCriteriaJsonShape {
        if (!value) {
            return false;
        }

        const isPrimitiveOrNull = (item: unknown) => isPrimitive(item) || item === Null;

        if (isPrimitiveOrNull(value)) {
            return true;
        } else if (Array.isArray(value) && value.every(isPrimitiveOrNull)) {
            return true;
        } else if (
            Array.isArray(value) &&
            value.length == 1 &&
            Array.isArray(value[0]) &&
            value[0].every(isPrimitiveOrNull)
        ) {
            return true;
        }

        // [todo] not type safe/easy to miss
        const keys = ["equals", "inArray", "inRange"];
        const entries = Object.entries(value);

        return entries.some(
            ([key, value]) =>
                keys.includes(key) &&
                (isPrimitiveOrNull(value) || (Array.isArray(value) && value.every(isPrimitiveOrNull)))
        );
    }

    function primitiveJsonShapeToClassShape(jsonShape: PrimitiveCriteriaJsonShape): ICriterionShape {
        const isPrimitiveOrNull = (item: unknown): item is Primitive | typeof Null =>
            isPrimitive(item) || item === Null;

        const isStringOrNumber = (item: unknown): item is typeof String | typeof Number =>
            item === String || item === Number;

        if (isPrimitiveOrNull(jsonShape)) {
            return isValueShape(jsonShape);
        } else if (Array.isArray(jsonShape) && jsonShape.length == 1 && isPrimitiveOrNull(jsonShape[0])) {
            return inSetShape(jsonShape[0]);
        } else if (
            Array.isArray(jsonShape) &&
            jsonShape.length == 2 &&
            isStringOrNumber(jsonShape[0]) &&
            isStringOrNumber(jsonShape[1]) &&
            jsonShape[0] === jsonShape[1]
        ) {
            return inRangeShape(jsonShape[0]);
        } else if (
            Array.isArray(jsonShape) &&
            jsonShape.length === 1 &&
            Array.isArray(jsonShape[0]) &&
            jsonShape[0].every(isPrimitiveOrNull)
        ) {
            return inSetShape(jsonShape[0]);
        } else if (Array.isArray(jsonShape) && (jsonShape as any[]).every(isPrimitiveOrNull)) {
            // [todo] cast to any
            return isValueShape(jsonShape as any);
        }

        // [todo] need to first implement "and" criteria shape, and probably a few criteria math for "and"
        // as well, as I haven't really used/tested it that much
        // // [todo] not type safe/easy to miss
        // const keys = ["equals", "inArray", "inRange"];
        // const entries = Object.entries(jsonShape);

        throw new Error(`invalid/unsupported primitive criteria json shape`);
    }

    function entityCriteriaJsonShapeToClassShape(
        requiredJsonShape: EntityCriteriaJsonShape<any>,
        optionalJsonShape: EntityCriteriaJsonShape<any>
    ): ICriterionShape {
        const requiredItems: NamedCriteriaShapeItems = {};

        for (const [key, itemJsonShape] of Object.entries(requiredJsonShape)) {
            if (isPrimitiveCriteriaJsonShape(itemJsonShape)) {
                requiredItems[key] = primitiveJsonShapeToClassShape(itemJsonShape);
            } else {
                // [todo] unsafe assertion
                requiredItems[key] = entityCriteriaJsonShapeToClassShape(itemJsonShape as any, {});
            }
        }

        const optionalItems: NamedCriteriaShapeItems = {};

        for (const [key, itemJsonShape] of Object.entries(optionalJsonShape)) {
            if (isPrimitiveCriteriaJsonShape(itemJsonShape)) {
                optionalItems[key] = primitiveJsonShapeToClassShape(itemJsonShape);
            } else {
                // [todo] unsafe assertion
                optionalItems[key] = entityCriteriaJsonShapeToClassShape({}, itemJsonShape as any);
            }
        }

        return namedShape(requiredItems, optionalItems);
    }

    it("works #1", () => {
        interface Foo {
            id: number;
            name: string | null;
            bar: Bar;
        }

        interface Bar {
            id: number;
            description: string | null;
        }

        const requiredJsonShape: EntityCriteriaJsonShape<Foo> = {
            id: Number,
            name: [String, Null],
        };

        const optionalJsonShaoe: EntityCriteriaJsonShape<Foo> = {
            bar: {
                description: [[String, Null]],
            },
        };

        const classShape = entityCriteriaJsonShapeToClassShape(requiredJsonShape, optionalJsonShaoe);
        const expected = namedShape(
            { id: isValueShape(Number), name: isValueShape([String, Null]) },
            { bar: namedShape({}, { description: inSetShape([String, Null]) }) }
        );

        expect(classShape).toEqual(expected);
    });

    function jsonShapeToClassShape(jsonShape: CriteriaJsonShape): ICriterionShape {
        if (isPrimitiveCriteriaJsonShape(jsonShape)) {
            return primitiveJsonShapeToClassShape(jsonShape);
        }

        throw new Error(`invalid/unsupported criteria json shape`);
    }

    type PrimitiveCriteriaJsonShapeInstance<T, R = true> = T extends Primitive | typeof Null
        ? ReturnType<T> // equals
        : T extends [Primitive | typeof Null]
        ? ReturnType<T[0]>[] // in-array
        : T extends [Primitive, Primitive]
        ? T[0] extends T[1]
            ? T[1] extends T[0]
                ? [ReturnType<T[0]> | undefined, ReturnType<T[1]> | undefined] // in-range
                : ReturnType<T[number]> // equals (multiple primitive types)
            : ReturnType<T[number]> // equals (multiple primitive types)
        : T extends [(Primitive | typeof Null)[]]
        ? ReturnType<T[0][number]>[] // in-array (multiple primitive types)
        : T extends (Primitive | typeof Null)[]
        ? ReturnType<T[number]> // equals (multiple primitive types)
        : R extends true
        ? InstantiatedEquals<T> & InstantiatedInArray<T> & InstantiatedInRange<T>
        : Partial<InstantiatedEquals<T> & InstantiatedInArray<T> & InstantiatedInRange<T>>;

    type InstantiatedEquals<T> = T extends Record<"equals", Primitive | typeof Null>
        ? Record<"equals", ReturnType<T["equals"]>>
        : T extends Record<"equals", (Primitive | typeof Null)[]>
        ? Record<"equals", ReturnType<T["equals"][number]>>
        : {};

    type InstantiatedInArray<T> = T extends Record<"inArray", Primitive | typeof Null>
        ? Record<"inArray", ReturnType<T["inArray"]>[]>
        : T extends Record<"inArray", (Primitive | typeof Null)[]>
        ? Record<"inArray", ReturnType<T["inArray"][number]>[]>
        : {};

    type InstantiatedInRange<T> = T extends Record<"inRange", Primitive | typeof Null>
        ? Record<"inRange", [ReturnType<T["inRange"]>, ReturnType<T["inRange"]>]>
        : T extends Record<"inRange", (Primitive | typeof Null)[]>
        ? Record<"inRange", [ReturnType<T["inRange"][number]>, ReturnType<T["inRange"][number]>]>
        : {};

    // type EntityCriteriaShapeInstanceRequired<T, S extends EntityCriteriaShape<T>> = {
    type EntityCriteriaJsonInstanceRequired<T, S> = {
        [K in keyof (S | T)]-?: T[K] extends ReturnType<Primitive | typeof Null>
            ? PrimitiveCriteriaJsonShapeInstance<S[K]>
            : EntityCriteriaJsonInstanceRequired<Exclude<T[K], undefined>, S[K]>;
    };

    // type EntityCriteriaShapeInstanceOptional<T, S extends EntityCriteriaShape<T>> = {
    type EntityCriteriaJsonInstanceOptional<T, S> = {
        [K in keyof (S | T)]?: T[K] extends ReturnType<Primitive | typeof Null>
            ? PrimitiveCriteriaJsonShapeInstance<S[K], false>
            : EntityCriteriaJsonInstanceOptional<Exclude<T[K], undefined>, S[K]>;
    };

    type EntityCriteriaJsonInstance<T, RS, OS> = EntityCriteriaJsonInstanceOptional<T, OS> &
        EntityCriteriaJsonInstanceRequired<T, RS>;

    class FooBlueprint {
        id = define(Number, { id: true, required: true });
        name = define(String, { required: true });
        bar = define(BarBlueprint);
        numbers = define(Number, { required: true, array: true });
        // bar = define(BarBlueprint, { required: true });
    }

    class BarBlueprint {
        id = define(Number, { id: true, required: true });
        fooId = define(Number, { required: true });
        name = define(String, { required: true });
        description = define(String);
        baz = define(BazBlueprint, { required: true });
    }

    class BazBlueprint {
        id = define(Number, { id: true, required: true });
        barId = define(Number, { required: true });
        level = define(Number, { required: true });
    }

    type Foo = BlueprintInstance<FooBlueprint>;

    // interface Foo {
    //     id: number;
    //     name: string;
    // }

    function instantiateFooShape<RS extends EntityCriteriaJsonShape<Foo>, OS extends EntityCriteriaJsonShape<Foo>>(
        required: RS | EntityCriteriaJsonShape<Foo>,
        optional: OS | EntityCriteriaJsonShape<Foo>
    ): EntityCriteriaJsonInstance<Foo, RS, OS> {
        return {} as any;
    }

    xit("playing around", () => {
        // const instance = instantiateFooShape({ id: [Number, Number], name: String });
        const instance = instantiateFooShape(
            {
                // id: {
                //     equals: [Number, String],
                //     inArray: Number,
                // },
                id: [Number, Number],
                name: String,
                bar: {
                    id: Number,
                    baz: {
                        level: [Number, Number],
                    },
                },
                numbers: {
                    equals: Number,
                    some: Number,
                },
            },
            {
                // id: {
                //     inRange: [String, Null],
                // },
                bar: {
                    fooId: Number,
                },
            }
        );
        // instance.id.inRange;
        instance.name;
        instance.id;
        instance.bar.id;
        instance.bar.fooId;
        instance.bar?.fooId;
        instance.bar.baz.level;
        instance.numbers;
        // instance.bar.baz.
    });
});
