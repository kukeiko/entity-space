import { TypedQuery, TypedInstance, TypedSelection, TypedCriteria, Property, Instance, TypedSelector } from "src";
import { TreeNodeModel, CanvasModel, CircleModel, SquareModel, TriangleModel } from "../facade/model";

xdescribe("prototyping-playground", () => {
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
