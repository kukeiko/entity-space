import {
    TypedQuery,
    TypedInstance,
    TypedSelection,
    TypedSelector,
    Criterion,
    Class,
    InNumberSetCriterion,
    InNumberRangeCriterion,
    inSet,
    inRange,
    matches,
    or,
    InStringRangeCriterion,
    OrCriteria,
    permutateEntries,
    AndCriteria,
    CriterionTemplate,
    InstancedCriterionTemplate,
    OrCriteriaTemplate,
    AndCriteriaTemplate,
    NamedCriteriaTemplate,
} from "src";
import { TreeNodeModel, CanvasModel, CircleModel, SquareModel, TriangleModel } from "../facade/model";

type RemapTemplate<T> = {
    [K in keyof T]?: Exclude<T[K], undefined> extends boolean | number | string | null ? Class<Criterion> | Class<Criterion>[] : never;
    // : PropertyCriteriaBagTemplate<T[K]> | PropertyCriteriaBagTemplate<T[K]>[];
};

type InstantiatedTemplate<T> = {
    [K in keyof T]?: T[K] extends Class<Criterion>[] ? InstanceType<T[K][number]>[] : T[K] extends Class<Criterion> ? InstanceType<T[K]> : never;
};

export function Void(): undefined {
    return void 0;
}

export function Null(): null {
    return null;
}

const anySymbol: Symbol = Symbol("any");

export function Any(): any {
    return anySymbol;
}

export class ValueType<T extends () => any = () => any> {
    constructor(constructors: Iterable<T>) {
        this.constructors = Array.from(constructors);
        this.defaultValues = this.constructors.map(ctor => ctor());
    }

    readonly constructors: ReadonlyArray<T>;
    readonly defaultValues: ReadonlyArray<ReturnType<T>>;

    static Any(): ValueType {
        return new ValueType([Any]);
    }
}

export type ValueOfValueType<T extends ValueType> = T["defaultValues"][number];

const inNumberSet = new InNumberSetCriterion([1, 2, 3]);
const inNumberRange = new InStringRangeCriterion(["1", "3"]);

const reduced = inNumberSet.reduce(inNumberRange);
const reducedSet = inNumberSet.reduce(inNumberSet);
const reducedRange = inNumberRange.reduce(inNumberRange);

// credit to captain-yossarian https://captain-yossarian.medium.com/typescript-object-oriented-typings-4fd42ce14c75
// function Mixin<T extends ClassType, R extends T[]>(...classRefs: [...R]): new (...args: any[]) => UnionToIntersection<InstanceType<[...R][number]>> {
//     return merge(class {}, ...classRefs);
// }

describe("prototyping-playground", () => {
    xit("screwing around with criterion templates", () => {
        function takesTemplate<T extends CriterionTemplate>(template: T): InstancedCriterionTemplate<T> {
            if (Array.isArray(template)) {
                // is NamedCriteria or OrCriteria or AndCriteria
                const criteriaClass = template[0];
                const containedItems = template[1];
            } else {
                //
            }

            return {} as any;
        }

        type ShouldBeFalse = typeof OrCriteria extends typeof AndCriteria ? true : false;

        // const instanced_or_inNumberRange = takesTemplate([OrCriteria, [InNumberRangeCriterion]]);
        // instanced_or_inNumberRange.getItems()[0];

        // const instanced_or_inNumberRange_inNumberSet = takesTemplate([OrCriteria, [InNumberRangeCriterion, InNumberSetCriterion, [AndCriteria, [InStringRangeCriterion]]]]);
        // const item_B = instanced_or_inNumberRange_inNumberSet.getItems()[0];
        // const instanced_or_propertyCriteria = takesTemplate([
        //     NamedCriteria,
        //     { foo: [InNumberRangeCriterion, [OrCriteria, [InNumberRangeCriterion]]], bar: [InNumberSetCriterion, InNumberRangeCriterion] },
        // ]);

        // const foo = instanced_or_propertyCriteria.getBag().foo;
        // const bar = instanced_or_propertyCriteria.getBag().bar;
        // const instanced_deepMix = takesTemplate([OrCriteria, [[NamedCriteria, { foo: [InNumberRangeCriterion, [OrCriteria, [InNumberRangeCriterion]]] }]]]);
        const instanced_or_inNumberRange = takesTemplate(new OrCriteriaTemplate([InNumberRangeCriterion]));
        instanced_or_inNumberRange.getItems()[0];

        const instanced_or_inNumberRange_inNumberSet = takesTemplate(
            new OrCriteriaTemplate([InNumberRangeCriterion, InNumberSetCriterion, new AndCriteriaTemplate([InStringRangeCriterion])])
        );
        const item_B = instanced_or_inNumberRange_inNumberSet.getItems()[0];
        const instanced_or_propertyCriteria = takesTemplate(
            new NamedCriteriaTemplate({ foo: [InNumberRangeCriterion, new OrCriteriaTemplate([InNumberRangeCriterion])], bar: [InNumberSetCriterion, InNumberRangeCriterion] })
        );

        const foo = instanced_or_propertyCriteria.getBag().foo;
        const bar = instanced_or_propertyCriteria.getBag().bar;
        const instanced_deepMix = takesTemplate(
            new OrCriteriaTemplate([new NamedCriteriaTemplate({ foo: [InNumberRangeCriterion, new OrCriteriaTemplate([InNumberRangeCriterion])] })])
        );

        instanced_deepMix.getItems()[0].getBag().foo;
    });

    // interf

    it("user-criterion classes", () => {
        // instead of mapping, i'm thinking of letting the user create their own criterion class implementation.
        // i think we'll need a way to typify the contents of an/or criteria - e.g. "price" can be inRange or or (inRange | inRange),
        // but nothing else - so no and combinator and exactly 2 inRange instances

        interface Entity {
            productId: number;
            price: number;
        }

        const expected = or([
            matches<Entity>({
                price: inRange(200, 300, [false, true]),
                productId: inSet([2, 5]),
            }),
            inRange(100, 200),
        ]);

        interface ProductFilter {
            productIds?: number[];
            minPrice?: number;
            maxPrice?: number;
            minRating?: number;
            maxRating?: number;
        }

        class ProductCriterion extends Criterion {
            constructor() {
                super();
            }

            productIds?: InNumberSetCriterion;
            priceRange?: InNumberRangeCriterion;
            ratingRange?: InNumberRangeCriterion;
            searchText?: any;

            reduce(other: Criterion): boolean | Criterion {
                if (!(other instanceof ProductCriterion)) return false;

                const reductions: {
                    productIds?: InNumberSetCriterion;
                    priceRange?: InNumberRangeCriterion | InNumberRangeCriterion[];
                    ratingRange?: InNumberRangeCriterion | InNumberRangeCriterion[];
                } = {};

                if (this.productIds !== void 0 && other.productIds !== void 0) {
                    const result = this.productIds.reduce(other.productIds);

                    if (result === false) {
                        return false;
                    } else if (result !== true) {
                        reductions.productIds = result;
                    }
                }

                if (this.priceRange !== void 0 && other.priceRange !== void 0) {
                    const result = this.priceRange.reduce(other.priceRange);

                    if (result === false) {
                        return false;
                    } else if (result !== true) {
                        reductions.priceRange = result instanceof OrCriteria ? [...result.getItems()] : result;
                    }
                }

                if (this.ratingRange !== void 0 && other.ratingRange !== void 0) {
                    const result = this.ratingRange.reduce(other.ratingRange);

                    if (result === false) {
                        return false;
                    } else if (result !== true) {
                        reductions.ratingRange = result instanceof OrCriteria ? [...result.getItems()] : result;
                    }
                }

                if (Object.keys(reductions).length === 0) {
                    return true;
                }

                const reduced: typeof reductions = {};
                const criteria: ProductCriterion[] = [];

                if (reductions.productIds !== void 0) {
                    reduced.productIds = reductions.productIds;
                    // criteria.pu
                }

                type Foo = never extends Array<infer U> ? U : true;

                const permutated = permutateEntries(reductions);
                // const criteria : ProductCriterion[] = [];

                for (const permutation of permutated) {
                    const criterion = new ProductCriterion();

                    criterion.priceRange = permutation.priceRange;
                    criterion.productIds = permutation.productIds;
                    criterion.ratingRange = permutation.ratingRange;
                }

                throw new Error("Method not implemented.");
            }

            toString(): string {
                throw new Error("Method not implemented.");
            }

            toFilterDto(): ProductFilter[] {
                throw new Error("Method not implemented.");
            }
        }
    });

    it("criteria <> user-filter mapping", () => {
        interface Mapping {
            properties: string[];
            criterionType: Class<Criterion>;
        }

        interface Entity {
            productId: number;
            price: number;
        }

        interface FilterA {
            productIds?: number[];
            searchText?: string; // could be "and" combined string-fn criteria
        }

        // {number} => number[]

        interface FilterB {
            minPrice?: number;
            maxPrice?: number;
        }

        class Mapperli<T> {
            // property(x).mapsTo(inSet)
            // properties(a,b).mapTo(inRange)
            // property(productIds).mapToPropertyOfEntity(productId, inSet)
            // property(minPrice, maxPrice).mapToPropertyOfEntity(price, inRange)
        }
    });

    it("picking criteria", () => {
        // [todo] without thinking i've written [1-7] a lot (instead of [1, 7]) - maybe good idea to switch to that notation?
        // it would make it easier to pick out in-range criteria in a string where there's also in-set criteria
        // i've also put spaces after each entity-criterion name symbol

        // [1-7] pick in-range is [1-7]
        // {1,2,3} pick in-range is missing payload: {1,2,3}
        // [1-7] & {1,2,3} pick in-range is [1-7]
        // [1-7] & [0-1] & [6-8] pick in-set is missing payload: [1-7] & [0-1] & [6-8]
        // [1-7] | {1,2,3} pick in-range is [1-7], missing payload: {1,2,3}
        // { foo: [1-7], bar: {1,2,3} } pick in-range is { foo: [1-7] }
        // { foo: [1-7] | {4,5,6}, bar: {1,2,3} } pick in-range is { foo: [1-7] }, missing payload: { foo: {4,5,6} }
        // { foo: [1-7] | {4,5,6}, bar: {1,2,3} | [10-20] } pick in-range is { foo: [1-7], bar: [10-20] }, missing payload: { foo: {4,5,6}, bar: {1,2,3} | [10-20]  } | { foo: [1-7], bar: {4,5,6} }
        //
        class Pickerli<M = {}> {}

        function acceptOneOf(): any {
            //
        }

        function acceptCombinationOf(): any {
            //
        }
    });

    const treeNodeCreatable: TypedInstance<TreeNodeModel, "creatable"> = {
        name: "foo",
        parentId: 3,
    };

    const treeNodePatch: TypedInstance<TreeNodeModel, "patchable"> = {
        name: "foo",
    };

    it("redo select() for moar performance", () => {
        const selector = new TypedSelector([TreeNodeModel]);
        const selection = selector
            .select(
                treeNode => treeNode.children,
                children =>
                    children.select(
                        child => child.parents,
                        parents => parents.select(parent => parent.level)
                    )
            )
            .select(treeNode => treeNode.metadata)
            .select(
                treeNode => treeNode.children,
                children => children.select(child => child.name)
            )
            .get();
    });

    it("playing w/ unions", () => {
        class CanvasQuery extends TypedQuery<CanvasModel> {
            getModel() {
                return [CanvasModel];
            }

            model = [CanvasModel];
        }

        type CanvasQueryDefaultPayload = TypedQuery.Payload<CanvasQuery>;

        const defaultPayload: CanvasQueryDefaultPayload = [
            {
                id: 1,
                name: "foo",
                authorId: 8,
                shapes: [{ type: "triangle", id: 1 }],
            },
        ];

        const canvasSelection: TypedSelection<CanvasModel> = {
            author: true,
            shapes: {
                canvas: true,
                angleA: true,
                area: true,
                angleB: true,
                length: true,
            },
        };

        // const selection = select([CanvasModel], x => x.author(x => x.name()).shapes(x => x.area().radius().length().canvas().angleA().angleB().angleC()));

        const selection = new TypedSelector([CanvasModel])
            // .select(x => x.id)
            .select(x => x.author)
            .select(
                x => x.shapes
                // [todo] selecting the type bricked the models below (property "type" is missing)
                // x => x.select(x => x.type).select(x => x.length),
            )
            .get();

        const selectedInstance: TypedInstance.Selected<CanvasModel, typeof selection> = {
            id: 7,
            authorId: 3,
            author: {
                id: 3,
                name: "susi",
            },
            name: "malwand",
            shapes: [
                // {
                // }
                // { id: 8, type: "square", area: 3, length: 2, canvas: { id: 7, name: "malwand" } },
                // { id: 19, type: "circle", area: 9, radius: 123, canvas: { id: 7, name: "malwand" } },
                // { id: 21, type: "triangle", area: 13, angleA: 1, angleB: 2, angleC: 3, canvas: { id: 7, name: "malwand" } },
            ],
        };
    });

    it("union criteria", () => {
        // const canvasCriteria: TypedCriteria<CanvasModel> = [
        //     {
        //         shapes: [
        //             {
        //                 angleA: [{ op: ">", value: 3 }],
        //                 angleB: [{ op: ">", value: 3 }],
        //                 angleC: [{ op: ">", value: 3 }],
        //                 area: [{ op: ">", value: 3 }],
        //                 id: [{ op: ">", value: 3 }],
        //                 length: [{ op: ">", value: 3 }],
        //                 radius: [{ op: ">", value: 3 }],
        //                 canvas: [
        //                     {
        //                         shapes: [
        //                             {
        //                                 angleA: [{ op: ">", value: 3 }],
        //                                 angleB: [{ op: ">", value: 3 }],
        //                                 angleC: [{ op: ">", value: 3 }],
        //                                 area: [{ op: ">", value: 3 }],
        //                                 id: [{ op: ">", value: 3 }],
        //                                 length: [{ op: ">", value: 3 }],
        //                                 radius: [{ op: ">", value: 3 }],
        //                             },
        //                         ],
        //                     },
        //                 ],
        //             },
        //         ],
        //     },
        // ];
    });

    it("union as entry type", () => {
        type ShapeModels = CircleModel | SquareModel | TriangleModel;
        type UnionQuery = TypedQuery<ShapeModels>;
        type UnionQueryPayload = TypedQuery.Payload<UnionQuery>;

        const payload: UnionQueryPayload = [
            {
                type: "triangle",
                id: 1,
                angleA: 3,
            },
        ];

        class ShapeQuery extends TypedQuery<ShapeModels> {
            getModel() {
                return [CircleModel, SquareModel, TriangleModel];
            }

            model = [CircleModel, SquareModel, TriangleModel];
        }

        type ShapeQueryPayload = TypedQuery.Payload<ShapeQuery>;

        const shapeQueryPayload: ShapeQueryPayload = [
            {
                type: "triangle",
                id: 1,
                angleA: 3,
            },
            {
                type: "square",
                id: 3,
                length: 8,
            },
        ];

        // const selection = select([CircleModel, SquareModel, TriangleModel], x => x.canvas(x => x.shapes(x => x.canvas())));

        // const selectedInstances : Instance.Selected<ShapeModels, typeof selection>[] = [
        //     {
        //         canvas: {
        //             shapes: [{
        //                 type: "circle",

        //             }]
        //         }
        //     }
        // ];
    });
});
