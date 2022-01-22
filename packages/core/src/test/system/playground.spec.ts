import {
    AndCriteriaTemplate,
    CriterionTemplate,
    InNumberRangeCriterion,
    InNumberSetCriterion,
    InstancedCriterionTemplate,
    InStringRangeCriterion,
    NamedCriteriaTemplate,
    OrCriteriaTemplate,
} from "@entity-space/criteria";
import { Instance } from "../../lib/entity/blueprint/public";
import { Expansion } from "../../lib/expansion/public";
import { TreeNodeRepository } from "../facade/data";
import { CanvasModel, UserModel } from "../facade/model";

const inNumberSet = new InNumberSetCriterion([1, 2, 3]);
const inNumberRange = new InStringRangeCriterion(["1", "3"]);

const reduced = inNumberSet.reduce(inNumberRange);
const reducedSet = inNumberSet.reduce(inNumberSet);
const reducedRange = inNumberRange.reduce(inNumberRange);
type Unbox<T> = T extends Array<infer U> ? U : T;
type Box<T, U = any[]> = any[] extends U ? T[] : T;

// credit to captain-yossarian https://captain-yossarian.medium.com/typescript-object-oriented-typings-4fd42ce14c75
// function Mixin<T extends ClassType, R extends T[]>(...classRefs: [...R]): new (...args: any[]) => UnionToIntersection<InstanceType<[...R][number]>> {
//     return merge(class {}, ...classRefs);
// }

describe("prototyping-playground", () => {
    const treeNodeRepo = new TreeNodeRepository();
    it("generic expand w/ union types", () => {
        // type Expansion<T> = T extends number | string
        //     ? true
        //     : T extends any[]
        //     ? Expansion<T[number]> | true
        //     : T extends Record<string, infer U>
        //     ? Expansion<U>
        //     : { [K in keyof T]?: Expansion<T[K]> } | true;

        // type Expand<T, E> = T extends number | string
        //     ? Exclude<T, undefined>
        //     : T extends any[]
        //     ? Expand<T[number], E>[]
        //     : "valueOf" extends keyof E // dirty solution, but cleaner for intellisense
        //     ? T
        //     : T extends Record<string, infer X>
        //     ? Record<string, Expand<X, E>>
        //     : T & { [K in keyof (T | E)]-?: Expand<T[K], E[K]> };

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

        function takesExpansion<E = Expansion<Instance<CanvasModel>>>(expansion: E): typeof expansion {
            return {} as any;
        }

        takesExpansion({ author: {} });
    });

    it("trying to implement generic expand", () => {
        interface Brand {
            id: number;
            name: string;
        }

        interface Stuff {
            id: number;
            moo?: number;
        }

        interface Product {
            id: number;
            name: string;
            price: number;
            rating?: number;
            brand: Brand;
            reviews?: ProductReview[];
            _stuff?: {
                [k: string]: Stuff;
            };
        }

        interface ProductReview {
            id: number;
            productId?: number;
            reviewText?: string;
            product?: Product;
        }

        type Expansion<T> = T extends number | string
            ? true
            : T extends any[]
            ? Expansion<T[number]> | true
            : // : T extends Record<string, infer U>
              // ? Expansion<U>
              { [K in keyof T]?: Expansion<T[K]> } | true;

        type Expand<T, E> = T extends number | string
            ? Exclude<T, undefined>
            : T extends any[]
            ? Expand<T[number], E>[]
            : "valueOf" extends keyof E // dirty solution, but cleaner for intellisense
            ? T
            : T extends Record<string, infer X>
            ? Record<string, Expand<X, E>>
            : T & { [K in keyof (T | E)]-?: Expand<T[K], E[K]> };

        type X = keyof true;
        type ExpandedValue = Expand<Product["rating"], "asdasd">;
        type ExpandedArray = Expand<Product["reviews"], "asdasd">;
        type MappedProduct = { [K in keyof Product]: number };
        // type MappedProduct = { [K in keyof Product]: K extends "brand" ? Brand : number };

        // function takesExpansion<E extends Expansion<MappedProduct>>(expansion: E): typeof expansion {
        type ProductOrReview = Product | ProductReview;

        function takesExpansion<E extends Expansion<ProductOrReview>>(expansion: E): typeof expansion {
            return {} as any;
        }
        // [todo] note somewhere that we cant have Expansion of mapped types w/ keyof; so we need to make model metadata
        // simpler when getting the Instance type of it
        function takesExpansion_notWorky<E extends Expansion<Record<keyof Product, true>>>(
            expansion: E
        ): typeof expansion {
            return {} as any;
        }

        const expansion = takesExpansion({ _stuff: { moo: true }, reviews: { reviewText: true } });
        takesExpansion_notWorky({});

        type ExpandedProduct = Expand<Product, typeof expansion>;
        const expandedProduct: ExpandedProduct = {
            id: 1,
            name: "foo",
            price: 64,
            brand: { id: 2, name: "bar" },
            _stuff: {
                foo: { id: 3, moo: 4 },
            },
            reviews: [{ id: 123, reviewText: "" }],
        };

        type UserInstance = Instance<UserModel>;
        const user: UserInstance = { id: 1, name: "foo" };
        type UserExpansion = Expansion<UserInstance>;

        function takesUserExpansion_old<E extends UserExpansion>(expansion: E): typeof expansion {
            return expansion;
        }

        takesUserExpansion_old({});
    });

    xit("screwing around with criterion templates", () => {
        function instantiateTemplate<T extends CriterionTemplate>(template: T): InstancedCriterionTemplate<T> {
            return {} as any;
        }

        const instanced_or_inNumberRange = instantiateTemplate(new OrCriteriaTemplate([InNumberRangeCriterion]));
        instanced_or_inNumberRange.getItems()[0];

        const instanced_or_inNumberRange_inNumberSet = instantiateTemplate(
            new OrCriteriaTemplate([
                InNumberRangeCriterion,
                InNumberSetCriterion,
                new AndCriteriaTemplate([InStringRangeCriterion]),
            ])
        );
        const item_B = instanced_or_inNumberRange_inNumberSet.getItems()[0];
        const instanced_or_propertyCriteria = instantiateTemplate(
            new NamedCriteriaTemplate({
                foo: [InNumberRangeCriterion, new OrCriteriaTemplate([InNumberRangeCriterion])],
                bar: [InNumberSetCriterion, InNumberRangeCriterion],
            })
        );

        const foo = instanced_or_propertyCriteria.getBag().foo;
        const bar = instanced_or_propertyCriteria.getBag().bar;
        const instanced_deepMix = instantiateTemplate(
            new OrCriteriaTemplate([
                new NamedCriteriaTemplate({
                    foo: [InNumberRangeCriterion, new OrCriteriaTemplate([InNumberRangeCriterion])],
                }),
            ])
        );

        instanced_deepMix.getItems()[0].getBag().foo;
    });
});
