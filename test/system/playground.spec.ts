import { Query, createProperty, Instance, select, Selection, Criteria } from "src";
import { TreeNodeModel, CanvasModel, CircleModel, SquareModel, TriangleModel } from "../facade/model";

xdescribe("prototyping-playground", () => {
    const treeNodeCreatable: Instance<TreeNodeModel, "creatable"> = {
        name: "foo",
        parentId: 3,
    };

    const treeNodePatch: Instance<TreeNodeModel, "patchable"> = {
        name: "foo",
    };

    it("playing w/ unions", () => {
        class CanvasQuery extends Query<CanvasModel> {
            getModel() {
                return [CanvasModel];
            }
        }

        type CanvasQueryDefaultPayload = Query.Payload<CanvasQuery>;

        const defaultPayload: CanvasQueryDefaultPayload = [
            {
                id: 1,
                name: "foo",
                shapes: [{ type: "triangle", id: 1 }],
            },
        ];

        const canvasSelection: Selection<CanvasModel> = {
            author: true,
            shapes: {
                canvas: true,
                angleA: true,
                area: true,
                angleB: true,
                length: true,
            },
        };

        const selection = select([CanvasModel], x => x.author(x => x.name()).shapes(x => x.area().radius().length().canvas().angleA().angleB().angleC()));

        const selectedInstance: Instance.Selected<CanvasModel, typeof selection> = {
            id: 7,
            author: {
                id: 3,
                name: "susi",
            },
            name: "malwand",
            shapes: [
                { id: 8, type: "square", area: 3, length: 2, canvas: { id: 7, name: "malwand" } },
                { id: 19, type: "circle", area: 9, radius: 123, canvas: { id: 7, name: "malwand" } },
                { id: 21, type: "triangle", area: 13, angleA: 1, angleB: 2, angleC: 3, canvas: { id: 7, name: "malwand" } },
            ],
        };
    });

    it("union criteria", () => {
        const canvasCriteria: Criteria<CanvasModel> = [
            {
                shapes: [
                    {
                        angleA: [{ op: ">", value: 3 }],
                        angleB: [{ op: ">", value: 3 }],
                        angleC: [{ op: ">", value: 3 }],
                        area: [{ op: ">", value: 3 }],
                        id: [{ op: ">", value: 3 }],
                        length: [{ op: ">", value: 3 }],
                        radius: [{ op: ">", value: 3 }],
                        canvas: [
                            {
                                shapes: [
                                    {
                                        angleA: [{ op: ">", value: 3 }],
                                        angleB: [{ op: ">", value: 3 }],
                                        angleC: [{ op: ">", value: 3 }],
                                        area: [{ op: ">", value: 3 }],
                                        id: [{ op: ">", value: 3 }],
                                        length: [{ op: ">", value: 3 }],
                                        radius: [{ op: ">", value: 3 }],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
        ];
    });

    it("union as entry type", () => {
        type ShapeModels = CircleModel | SquareModel | TriangleModel;
        type UnionQuery = Query<ShapeModels>;
        type UnionQueryPayload = Query.Payload<UnionQuery>;

        const payload: UnionQueryPayload = [
            {
                type: "triangle",
                id: 1,
                angleA: 3,
            },
        ];

        class ShapeQuery extends Query<ShapeModels> {
            getModel() {
                return [CircleModel, SquareModel, TriangleModel];
            }
        }

        type ShapeQueryPayload = Query.Payload<ShapeQuery>;

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

        const selection = select([CircleModel, SquareModel, TriangleModel], x => x.canvas(x => x.shapes(x => x.canvas())));

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
