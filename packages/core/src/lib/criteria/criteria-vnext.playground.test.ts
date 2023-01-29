import { Null, Primitive, Unbox } from "@entity-space/utils";
import { BlueprintInstance } from "../schema/blueprint-instance";
import { Criterion } from "./criterion/criterion";
import { FooBlueprint } from "./test-models";

describe("playground: criteria v3", () => {
    type Foo = BlueprintInstance<FooBlueprint>;

    function takesFooShape<S extends EntityCriteriaShapeType<Foo>>(shape: S | EntityCriteriaShapeType<Foo>) {
        return shape;
    }

    class Builder<T> {
        takeShape<S extends EntityCriteriaShapeType<T>>(shape: S | EntityCriteriaShapeType<Foo>): S {
            return shape as S;
        }
    }

    const $required = Symbol();
    const $optional = Symbol();
    const $some = Symbol();
    const $every = Symbol();
    const $requiredAndOptionalType = Symbol();

    type Distribute<T> = T extends any ? T : never;
    type ExtendEachOther<A, B> = A extends B ? (B extends A ? true : never) : never;

    // shapes
    type ReshapedCriterion<T> = { reshaped: T[]; open: Criterion[] };

    interface ICriterion<S> {
        toJson(): S;
    }

    interface ICriterionShape<T> {
        reshape(criterion: Criterion): false | ReshapedCriterion<T>[];
    }

    const $IRangeCriterionShape = Symbol();

    interface IRangeCriterionShape<T> {
        [$IRangeCriterionShape]: true;
        reshape(criterion: Criterion): false | any[];
    }

    type InSetCriterionShapeInstance<S> = S extends [Primitive | typeof Null]
        ? ReturnType<S[0]>[]
        : S extends [(Primitive | typeof Null)[]]
        ? ReturnType<S[0][number]>[]
        : never;

    interface ISetCriterion<S> extends ICriterion<InSetCriterionShapeInstance<S>> {
        getValues(): (boolean | number | string | null)[];
        toJson(): InSetCriterionShapeInstance<S>;
    }

    const $ISetCriterionShape = Symbol();

    interface ISetCriterionShape<T> extends ICriterionShape<T> {
        [$ISetCriterionShape]: true;
        reshape(criterion: Criterion): false | ReshapedCriterion<T>[];
    }

    type PrimitiveCriteriaShapeType<T> =
        | T // equals
        | [T] // in-array
        | [T, T] // in-range
        | T[] // equals (multiple primitive types)
        | [T[]] // in-array (multiple primitive types)
        | ICriterionShape<any>;

    type PrimitiveCriteriaShapeInstance<S> = S extends Primitive | typeof Null
        ? ReturnType<S> // equals
        : S extends [Primitive | typeof Null]
        ? ReturnType<S[0]>[] // in-array
        : S extends [Primitive, Primitive]
        ? ExtendEachOther<S[0], S[1]> extends true
            ? [ReturnType<S[0]> | undefined, ReturnType<S[1]> | undefined] // in-range
            : ReturnType<S[number]> // in-array (multiple primitive types)
        : S extends [(Primitive | typeof Null)[]]
        ? ReturnType<S[0][number]>[] // in-array (multiple primitive types)
        : S extends (Primitive | typeof Null)[]
        ? ReturnType<S[number]> // equals (multiple primitive types)
        : S extends ICriterionShape<infer C>
        ? C extends ICriterion<infer CS>
            ? CS
            : never
        : never;

    function inSetShape<T extends Primitive | typeof Null, U extends T[]>(
        ...valueTypes: [...U]
    ): ISetCriterionShape<ISetCriterion<U>> {
        return {} as any;
    }

    function inSet<S>(shape: S): ISetCriterionShape<ISetCriterion<S>> {
        return {} as any;
    }

    // const testInSetShape = inSet([Number] as [typeof Number]);
    const testInSetShape = inSetShape(Number);

    type Test = PrimitiveCriteriaShapeInstance<ISetCriterionShape<ISetCriterion<[typeof Number]>>>;
    type Test_2 = PrimitiveCriteriaShapeInstance<typeof testInSetShape>;

    type ArrayCriteriaShapeType<T> = {};

    it("PrimitiveCriteriaShapeInstance should work", () => {
        const shape = Number;
        const shapeInstance: PrimitiveCriteriaShapeInstance<[typeof String, typeof String]> = {} as any;
    });

    type EntityCriteriaShapePropertyType<T> = T extends ReturnType<Primitive | typeof Null>
        ? PrimitiveCriteriaShapeType<Primitive | typeof Null>
        : EntityCriteriaShapeType<T>;

    type EntityCriteriaShapePropertiesType<E> = {
        // [K in keyof E]?: EntityCriteriaShapePropertyType<E[K]>;
        [K in keyof E]?: EntityCriteriaShapePropertyType<Unbox<E[K]> | E[K]>;
    };

    type EntityCriteriaShapeRequiredAndOptionalPropertiesType<E> = {
        [$required]?: EntityCriteriaShapePropertiesType<E>;
        [$optional]?: EntityCriteriaShapePropertiesType<E>;
    };

    type EntityCriteriaShapeType<E> =
        | EntityCriteriaShapeRequiredAndOptionalPropertiesType<E>
        | EntityCriteriaShapePropertiesType<E>;

    // type EntityCriteriaShapePropertyInstance<T, S, R> = T extends ReturnType<Primitive | typeof Null>
    //     ? PrimitiveCriteriaShapeInstance<S>
    //     : EntityCriteriaShapeInstance<T, S, R>;

    // type EntityCriteriaShapePropertyInstance<T, S, R, B> = T extends ReturnType<Primitive | typeof Null>
    //     ? B extends any[]
    //         ? { array: true }
    //         : PrimitiveCriteriaShapeInstance<S>
    //     : EntityCriteriaShapeInstance<T, S, R>;

    type EntityCriteriaShapePropertyInstance<T, S, R> = T extends ReturnType<Primitive | typeof Null>[]
        ? { array: true }
        : Unbox<T> extends ReturnType<Primitive | typeof Null>
        ? PrimitiveCriteriaShapeInstance<S>
        : T extends any[]
        ? { array: true }
        : EntityCriteriaShapeInstance<T, S, R>;

    type EntityCriteriaShapeInstanceRequired<E, S> = {
        [K in keyof (E | S)]-?: EntityCriteriaShapePropertyInstance<
            Unbox<Exclude<E[K], undefined>> | Exclude<E[K], undefined>,
            S[K],
            true
        >;
    };

    type EntityCriteriaShapeInstanceOptional<E, S> = {
        [K in keyof (E | S)]?: EntityCriteriaShapePropertyInstance<
            Unbox<Exclude<E[K], undefined>> | Exclude<E[K], undefined>,
            S[K],
            false
        >;
    };

    type EntityCriteriaShapeInstance<
        E,
        S,
        R = true
    > = S extends EntityCriteriaShapeRequiredAndOptionalPropertiesType<any>
        ? EntityCriteriaShapeInstanceRequired<E, S[typeof $required]> &
              EntityCriteriaShapeInstanceOptional<E, S[typeof $optional]>
        : R extends true
        ? EntityCriteriaShapeInstanceRequired<E, S>
        : EntityCriteriaShapeInstanceOptional<E, S>;

    xit("EntityCriteriaShapeInstance should work", () => {
        const fooBuilder = new Builder<Foo>();
        const fooShape = fooBuilder.takeShape({
            [$required]: {
                // name: String,
                name: inSetShape(Number),
                bar: {
                    [$required]: {
                        baz: { level: [Number] },
                    },
                    [$optional]: {
                        id: [Number],
                    },
                    id: Number,
                },
                numbers: Number,
            },
            [$optional]: {
                id: Number,
                bar: {
                    [$required]: {
                        name: [String, Null],
                    },
                    // id: Number,
                },
                // numbers: Null,
            },
        });
        const fooShapeInstance: EntityCriteriaShapeInstance<Foo, typeof fooShape> = {} as any;
        fooShapeInstance.id;
        fooShapeInstance.name;
        fooShapeInstance.bar;
        const bar = fooShapeInstance.bar;

        fooShapeInstance.bar?.name;

        if (fooShapeInstance.bar) {
            fooShapeInstance.bar.id;
            fooShapeInstance.bar.name;
        }

        const fooNumbers = fooShapeInstance.numbers;
        const baz = fooShapeInstance.bar.baz;
    });

    it("should work", () => {
        takesFooShape({ id: [Number], bar: { description: String } });

        const fooBuilder = new Builder<Foo>();
        const fooShape = fooBuilder.takeShape({ id: [Number], bar: { [$required]: { description: [String] } } });
    });

    it("todos", () => {
        /**
         * - can provide { id: String } even if id is of type "number"
         */
    });
});
