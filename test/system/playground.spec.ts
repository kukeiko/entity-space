import {
    InNumberSetCriterion,
    InNumberRangeCriterion,
    InStringRangeCriterion,
    CriterionTemplate,
    InstancedCriterionTemplate,
    OrCriteriaTemplate,
    AndCriteriaTemplate,
    NamedCriteriaTemplate,
} from "src";

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
            brand?: Brand;
            reviews?: ProductReview[];
            _stuff?: {
                [k: string]: Stuff;
            };
        }

        interface ProductReview {
            id: number;
            productId: number;
            reviewText: string;
            product?: Product;
        }

        // type Expansion = { [key: string]: true | Expansion | undefined };
        // type Expansion = { [key: string]: true | Expansion };

        // type TypedExpansion<T> = 1;

        type ExpandableKeys<T> = { [K in keyof T]: undefined extends T[K] ? K : never }[keyof T];

        // type Expansion<T> = { [K in ExpandableKeys<T>]?: true };
        // type Expansion<T> = { [K in keyof T]?: true | (T[K] extends Record<string, any> ? Expansion<T[K]> : never) };
        // type Expansion<T> = { [K in keyof T]?: T[K] extends number | string | undefined ? true : any[] extends T[K] ? Expansion<T[K][number]> : never };
        // type Expansion<T> = { [K in keyof T]?: T[K] extends number | string | undefined ? true : T[K] extends [] ? Expansion<T[K][number]> : never };

        // export type Expand<T, K extends Expansion<T>> = T & Required<Pick<T, keyof K>>;
        // type Expand<T, E extends Expansion<T>> = T & { [K in keyof E]: K extends keyof T ? Exclude<T[K], undefined> : never };
        // type Expand<T, E extends Expansion<Unbox<T>>> = T & { [K in keyof (E | T)]: Exclude<T[K], undefined> };
        // type Expand<T, E> = T & { [K in keyof (E | T)]: Exclude<T[K], undefined> };

        type Expansion<T> = T extends number | string
            ? true
            : T extends any[]
            ? Expansion<T[number]> | true
            : T extends Record<string, infer X>
            ? Expansion<T[keyof T]>
            : { [K in keyof T]?: Expansion<T[K]> } | true;

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

        function takesExpansion<E extends Expansion<Product>>(expansion: E): typeof expansion {
            return {} as any;
        }
        const int: Object[] = [];
        // const int = 3;

        const expansion = takesExpansion({ _stuff: { moo: true } });
        type ExpandedProduct = Expand<Product, typeof expansion>;
        const expandedProduct: ExpandedProduct = {
            id: 1,
            name: "foo",
            price: 64,
            brand: { id: 2, name: "bar" },
            _stuff: {
                foo: { id: 3, moo: 4 },
            },
        };
    });

    xit("screwing around with criterion templates", () => {
        function instantiateTemplate<T extends CriterionTemplate>(template: T): InstancedCriterionTemplate<T> {
            return {} as any;
        }

        const instanced_or_inNumberRange = instantiateTemplate(new OrCriteriaTemplate([InNumberRangeCriterion]));
        instanced_or_inNumberRange.getItems()[0];

        const instanced_or_inNumberRange_inNumberSet = instantiateTemplate(
            new OrCriteriaTemplate([InNumberRangeCriterion, InNumberSetCriterion, new AndCriteriaTemplate([InStringRangeCriterion])])
        );
        const item_B = instanced_or_inNumberRange_inNumberSet.getItems()[0];
        const instanced_or_propertyCriteria = instantiateTemplate(
            new NamedCriteriaTemplate({ foo: [InNumberRangeCriterion, new OrCriteriaTemplate([InNumberRangeCriterion])], bar: [InNumberSetCriterion, InNumberRangeCriterion] })
        );

        const foo = instanced_or_propertyCriteria.getBag().foo;
        const bar = instanced_or_propertyCriteria.getBag().bar;
        const instanced_deepMix = instantiateTemplate(
            new OrCriteriaTemplate([new NamedCriteriaTemplate({ foo: [InNumberRangeCriterion, new OrCriteriaTemplate([InNumberRangeCriterion])] })])
        );

        instanced_deepMix.getItems()[0].getBag().foo;
    });
});
