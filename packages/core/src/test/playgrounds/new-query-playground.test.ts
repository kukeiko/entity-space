import { BlueprintInstance, define, PackedEntitySelection, Select } from "@entity-space/common";
import { Class, Null, Primitive, Unbox } from "@entity-space/utils";
import { NamedCriteriaBag } from "../../lib/criteria/criterion/named/named-criteria";
import { CanvasBlueprint, Product, ShapeBlueprints, User, UserBlueprint } from "../content";

xdescribe("new query playground", () => {
    it("working example #1", () => {
        // [todo] i don't need "E extends Expansion<T>", but can instead just do "E = Expansion<T>" and intellisense fully works. what?
        // i want to understand why
        function query<T, E = PackedEntitySelection<T>>(
            type: T,
            criteria: NamedCriteriaBag,
            expansion: E
        ): Select<T, E> {
            return {} as any;
        }

        query({} as Product, {}, {});
        const users = query({} as User, {}, { name: true, children: { name: true } });
        users.children[0].name;
    });

    it("working example #2", () => {
        function query<T, E = PackedEntitySelection<BlueprintInstance<T>>>(
            type: Class<T>,
            criteria: NamedCriteriaBag,
            expansion: E
        ): Select<BlueprintInstance<T>, E> {
            return {} as any;
        }

        const user = query(
            UserBlueprint,
            {},
            { name: true, children: { name: true, reviews: { createdBy: { name: true } } } }
        );
        user.id;
        user.children[0].name;
        user.children[0].reviews[0].createdBy.name;
    });

    it("working example #3", () => {
        function query<
            T,
            E extends PackedEntitySelection<BlueprintInstance<T>> = PackedEntitySelection<BlueprintInstance<T>>
        >(type: Class<T>, criteria: NamedCriteriaBag, expansion: E): Select<BlueprintInstance<T>, E> {
            return {} as any;
        }

        const canvas = query(
            CanvasBlueprint,
            {},
            {
                shapes: { area: true, radius: true, length: true },
                author: { parent: { reviews: { createdBy: { children: true } } } },
            }
        );

        for (const shape of canvas.shapes) {
            switch (shape.type) {
                case "circle":
                    shape.area;
                    shape.radius;
                    break;

                case "square":
                    shape.area;
                    shape.length;
                    break;
            }
        }
    });

    it("working example #4", () => {
        function query<U extends Class[], E = PackedEntitySelection<BlueprintInstance<InstanceType<U[number]>>>>(
            type: U,
            criteria: NamedCriteriaBag,
            expansion: E
        ): Select<BlueprintInstance<InstanceType<U[number]>>, E> {
            return {} as any;
        }

        const shape = query(ShapeBlueprints, {}, { length: true, radius: true });

        switch (shape.type) {
            case "circle":
                shape.area;
                shape.radius;
                break;

            case "square":
                shape.length;
                break;
        }

        const canvas = query([CanvasBlueprint], {}, { shapes: { area: true, radius: true, length: true } });

        for (const shape of canvas.shapes) {
            switch (shape.type) {
                case "circle":
                    shape.area;
                    shape.radius;
                    break;

                case "square":
                    shape.area;
                    shape.length;
                    break;
            }
        }

        const user = query([UserBlueprint], {}, { createdBy: { name: true } });
    });

    it("simple criteria format", () => {
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

        type PrimitiveCriteriaShape<T extends Primitive | typeof Null = Primitive | typeof Null> =
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
                    ? ArrayCriteriaJsonShape<PrimitiveCriteriaShape> | PrimitiveCriteriaShape
                    : PrimitiveCriteriaShape
                : EntityCriteriaJsonShape<Unbox<T[K]>>;
            // [K in keyof T]?: PrimitiveCriteriaShape | EntityCriteriaShape<T[K]>;
        };

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
        instance.bar?.fooId;
        instance.bar.baz.level;
        instance.numbers;
        // instance.bar.baz.
    });
});
