import {
    TypedQuery,
    TypedInstance,
    TypedSelection,
    TypedSelector,
    EntityCriteria,
    ValueCriterion,
    Class,
    InStringSetCriterion,
    entityCriteria,
    InNumberSetCriterion,
    InNumberRangeCriterion,
    EntityCriterion,
    inSet,
    inRange,
    getInstanceClass,
    InStringRangeCriterion,
} from "src";
import { TreeNodeModel, CanvasModel, CircleModel, SquareModel, TriangleModel } from "../facade/model";
import { Product } from "../introduction/model";

type RemapTemplate<T> = {
    [K in keyof T]?: Exclude<T[K], undefined> extends boolean | number | string | null ? Class<ValueCriterion<T[K]>> | Class<ValueCriterion<T[K]>>[] : never;
    // : PropertyCriteriaBagTemplate<T[K]> | PropertyCriteriaBagTemplate<T[K]>[];
};

type InstantiatedTemplate<T> = {
    [K in keyof T]?: T[K] extends Class<ValueCriterion>[] ? InstanceType<T[K][number]>[] : T[K] extends Class<ValueCriterion> ? InstanceType<T[K]> : never;
};

describe("prototyping-playground", () => {
    it("remap criteria", () => {
        type Permutated<T extends Record<string, any[]>> = {
            [K in keyof T]: T[K][number];
        };

        function permutate(aggregated: any, entries: [string, any[]][]): any[] {
            if (entries.length === 0) {
                return [aggregated];
            }

            let allAggregated: any[] = [];
            let [key, shards] = entries[0];
            entries = entries.slice(1);
            aggregated = { ...aggregated };

            for (const shard of shards) {
                let nextAggregated = { ...aggregated, [key]: shard };
                allAggregated.push(...permutate(nextAggregated, entries));
            }

            return allAggregated;
        }

        function remap<T>(criterion: EntityCriterion<T>, template: RemapTemplate<T>): InstantiatedTemplate<T>[] {
            const entries = criterion.getEntries();
            const permutationEntries: [string, any[]][] = [];

            for (const key in template) {
                const entry = entries.find(([entryKey]) => entryKey === key);
                if (!entry) continue;

                const stuffInTemplate = template[key];
                const allowedTypes = Array.isArray(stuffInTemplate) ? stuffInTemplate : ([stuffInTemplate] as any[]);
                const filteredByType = entry[1].filter(item => allowedTypes.includes(getInstanceClass(item)));

                // [todo] instanceof checks against what's in template is missing
                if (Array.isArray(stuffInTemplate)) {
                    permutationEntries.push([key, [filteredByType]]);
                } else {
                    permutationEntries.push([key, filteredByType]);
                }
            }

            return permutate({}, permutationEntries);
        }

        const itemToPermutate = {
            foo: ["foo-1", "foo-2"],
            bar: ["bar-1", "bar-2", "bar-3"],
        };

        // console.log(JSON.stringify(permutate({}, Object.entries(itemToPermutate))));

        const productCriteria = entityCriteria<Product>({
            name: [inSet(["foo", "bar"]), inRange("a", "z"), inSet(["khaz", "mo", "dan"])],
            price: [inRange(0, 100), inRange(700, 1200)],
        });

        // [todo] hacky workaround to satisfy compiler; i don't want to comment out the current remapping
        // functionality so i still see the method uses here in case i do "find all references"
        const productCriterion = productCriteria.getItems()[0] as EntityCriterion<Product>;
        const remapped = remap(productCriterion, { name: InStringSetCriterion, price: InNumberRangeCriterion });
        console.log(JSON.stringify(remapped));
        console.log(remapped.length);

        // const permutations = permutate({}, productCriterion.getEntries());
        // console.log(JSON.stringify(permutations));

        // console.log(permutate(productCriteria.getItems()[0], Object.entries(productCriteria.getItems()[0].getBag())))

        const foo: RemapTemplate<Product> = {
            name: InStringSetCriterion,
            price: [InNumberSetCriterion, InNumberRangeCriterion],
        };

        function remapCriterion<T, U extends RemapTemplate<T>>(criterion: EntityCriterion<T>, handler: () => U): InstantiatedTemplate<U> {
            const template = handler();
            return {} as any;
        }

        function remapCriteria<T, U extends RemapTemplate<T>>(criteria: EntityCriteria<T>, handler: () => U): InstantiatedTemplate<U> {
            const template = handler();
            return {} as any;
        }

        const extracted = remapCriteria(entityCriteria<Product>([]), () => ({ name: InStringSetCriterion, price: [InNumberSetCriterion, InNumberRangeCriterion] }));
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
                x => x.children,
                x =>
                    x.select(
                        x => x.parents,
                        x => x.select(x => x.level)
                    )
            )
            .select(x => x.metadata)
            .select(
                x => x.children,
                x => x.select(x => x.name)
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
