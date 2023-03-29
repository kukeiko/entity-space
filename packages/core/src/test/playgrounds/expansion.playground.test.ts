import { Unbox } from "@entity-space/utils";
import { PackedEntitySelection } from "../../lib/common/packed-entity-selection.type";
import { EntityBlueprintInstance } from "../../lib/schema/entity-blueprint-instance.type";
import { define } from "../../lib/schema/entity-blueprint-property";
import { Select } from "../../lib/common/select.type";
import { Canvas, CanvasBlueprint, ProductBlueprint, ShapeBlueprints, Square } from "../content";

// credit to captain-yossarian https://captain-yossarian.medium.com/typescript-object-oriented-typings-4fd42ce14c75
// function Mixin<T extends ClassType, R extends T[]>(...classRefs: [...R]): new (...args: any[]) => UnionToIntersection<InstanceType<[...R][number]>> {
//     return merge(class {}, ...classRefs);
// }

xdescribe("playground: selection", () => {
    it("simple expand w/ union types", () => {
        function takesSelection<E extends PackedEntitySelection<Canvas>>(selection: E): typeof selection {
            return {} as any;
        }

        const foo = takesSelection({ shapes: { angleA: true, length: true } });
    });

    it("complex expand w/ union types", () => {
        // [todo] convert to type tests
        class CustomUserBlueprint {
            id = define(Number, { required: true });
            name = define(String);
            createdBy = define(CustomUserBlueprint);
            updatedBy = define(CustomUserBlueprint, { nullable: true });
            children = define(CustomUserBlueprint, { array: true });
            // metadata ref is for entities where the dev does not want to (or cannot) use blueprints
            products = define(ProductBlueprint, { array: true });
            canvas = define(CanvasBlueprint);
            shapes = define(ShapeBlueprints, { array: true });
        }

        type CustomUser = EntityBlueprintInstance<CustomUserBlueprint>;

        const user: CustomUser = {
            id: 823,
            updatedBy: null,
            products: [
                {
                    brand: { id: 1, name: "WeMakeGudStuff" },
                    id: 123,
                    name: "Gud Stuff",
                    price: 4982,
                },
            ],
            children: [{ id: 8445 }],
            createdBy: {
                id: 913123,
                createdBy: {
                    id: 1518,
                    createdBy: {
                        id: 1241,
                        createdBy: {
                            id: 123,
                            createdBy: {
                                id: 123,
                                name: "foo",
                            },
                        },
                    },
                },
            },
        };

        function takesUserSelection<E extends PackedEntitySelection<CustomUser>>(selection: E): typeof selection {
            return {} as any;
        }

        const simpleSelection = takesUserSelection({ updatedBy: true, children: { shapes: true } });

        type SimpleSelectedUser = Select<CustomUser, typeof simpleSelection>;

        const simpleSelectedUser: SimpleSelectedUser = {
            id: 1,
            updatedBy: null,
            children: [{ id: 2, shapes: [{ id: 3, type: "circle", radius: 3 }] }],
        };

        type Foo = PackedEntitySelection<Square[]>;

        const deepExpansion = takesUserSelection({
            id: true,
            updatedBy: true,
            createdBy: { createdBy: { name: true, children: { createdBy: true, name: true } } },
            canvas: { shapes: { area: true, length: true, radius: true } },
            children: {},
        });

        type ExpandedUserInstance = Select<CustomUser, typeof deepExpansion>;

        const expandedUser: ExpandedUserInstance = {
            id: 1,
            createdBy: {
                id: 90123,
                createdBy: { id: 123123, name: "foo", children: [{ id: 8234, createdBy: { id: 1312 }, name: "foo" }] },
            },
            updatedBy: null,
            canvas: {
                id: 4123,
                name: "my artsy drawing",
                shapes: [
                    { type: "circle", area: 123, id: 13984, radius: 123 },
                    { area: 456, id: 1982321, type: "square", length: 123 },
                ],
            },
            children: [],
        };
    });

    it("isExpanded() prototyping", () => {
        type ExpansionValue<T, U = Unbox<T>> = true | { [K in keyof U]?: ExpansionValue<U[K]> };

        interface Foo {
            id: number;
            name: string;
            bar?: Bar;
        }

        interface Bar {
            id: number;
            name: string;
            baz?: Baz[];
        }

        interface BazA {
            id: number;
            name: string;
            type: "baz-a";
            onlyInA: boolean;
        }

        interface BazB {
            id: number;
            name: string;
            type: "baz-b";
            onlyInB: boolean;
        }

        type Baz = BazA | BazB;

        function isExpanded<T, E extends ExpansionValue<T>>(entity: T, expansion: E): entity is T & Select<T, E> {
            return true;
        }

        const foo: Foo = {} as any;

        if (isExpanded(foo, { bar: { baz: { onlyInA: true } } })) {
            const item = foo.bar.baz[0];
        }
    });
});
