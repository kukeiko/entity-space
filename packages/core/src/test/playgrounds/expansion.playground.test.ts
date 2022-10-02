import { Expand, ExpansionValue } from "@entity-space/common";
import { Unbox } from "@entity-space/utils";
import { BlueprintInstance, define, Metadata, MetadataReference } from "../../index";
import { CanvasModel } from "../content";

// credit to captain-yossarian https://captain-yossarian.medium.com/typescript-object-oriented-typings-4fd42ce14c75
// function Mixin<T extends ClassType, R extends T[]>(...classRefs: [...R]): new (...args: any[]) => UnionToIntersection<InstanceType<[...R][number]>> {
//     return merge(class {}, ...classRefs);
// }

describe("playground: expansion", () => {
    it("simple expand w/ union types", () => {
        interface Square {
            id: number;
            area: number;
            length: number;
            type: "square";
        }

        interface Circle {
            id: number;
            area: number;
            radius: number;
            type: "circle";
        }

        interface Canvas {
            id: number;
            name: string;
            shapes?: (Square | Circle)[];
        }

        function takesExpansion<E = ExpansionValue<BlueprintInstance<CanvasModel>>>(expansion: E): typeof expansion {
            return {} as any;
        }

        takesExpansion({ author: {} });
    });

    xit("complex expand w/ union types", () => {
        interface Square {
            id: number;
            area?: number;
            length?: number;
            type: "square";
        }

        interface Circle {
            id: number;
            area?: number;
            radius?: number;
            type: "circle";
        }

        type Shape = Square | Circle;

        interface Canvas {
            id: number;
            name: string;
            shapes: Shape[];
        }

        interface Brand {
            id: number;
            name: string;
        }

        interface Product {
            id: number;
            name: string;
            price: number;
            rating?: number;
            brand: Brand;
            reviews?: ProductReview[];
        }

        interface ProductReview {
            id: number;
            productId?: number;
            reviewText?: string;
            product?: Product;
        }

        // [todo] using MetadataReference because Blueprints don't support discriminated unions yet
        // [update] actually not 100% true - i already use Blueprints in the "new-query-playground.test"
        const productMetadata: Metadata<Product> = {} as any;
        const productMetadataRef: MetadataReference<Product> = {} as any;
        const canvasMetadataRef: MetadataReference<Canvas> = {} as any;
        const squareMetadataRef: MetadataReference<Square> = {} as any;
        const circleMetadataRef: MetadataReference<Circle> = {} as any;

        class UserModel {
            id = define(Number, { required: true });
            name = define(String);
            createdBy = define(UserModel);
            updatedBy = define(UserModel, { nullable: true });
            children = define(UserModel, { array: true });
            // metadata ref is for entities where the dev does not want to (or cannot) use blueprints
            products = define(productMetadataRef, { array: true });
            canvas = define(canvasMetadataRef);
            shapes = define([squareMetadataRef, circleMetadataRef] as MetadataReference<Shape>[], { array: true });
        }

        type UserInstance = BlueprintInstance<UserModel>;

        const user: UserInstance = {
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

        function takesUserExpansion<E extends ExpansionValue<UserInstance>>(expansion: E): typeof expansion {
            return {} as any;
        }

        takesUserExpansion({ children: true });

        const simpleExpansion = takesUserExpansion({ updatedBy: true });

        type SimpleExpandedUser = Expand<UserInstance, typeof simpleExpansion>;

        const simpleExpandedUser: SimpleExpandedUser = {
            id: 1,
            updatedBy: null,
        };

        type Foo = ExpansionValue<Square[]>;

        const deepExpansion = takesUserExpansion({
            id: true,
            updatedBy: true,
            createdBy: { createdBy: { name: true, children: { createdBy: true, name: true } } },
            canvas: { shapes: { area: true, length: true, radius: true } },
            children: {},
        });

        type ExpandedUserInstance = Expand<UserInstance, typeof deepExpansion>;

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

    xit("isExpanded() prototyping", () => {
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

        function isExpanded<T, E extends ExpansionValue<T>>(entity: T, expansion: E): entity is T & Expand<T, E> {
            return true;
        }

        const foo: Foo = {} as any;

        if (isExpanded(foo, { bar: { baz: { onlyInA: true } } })) {
            const item = foo.bar.baz[0];
        }
    });
});
