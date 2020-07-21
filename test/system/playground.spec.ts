import { Query, createProperty } from "src";
import { Instance } from "src/advanced/instance";
import { TreeNode } from "../facade";
import { ObjectSelector, Selected } from "../../src/advanced/selector";
import { ModelSelection } from "../../src/advanced/selection";
import { EntityCriteria } from "../../src/advanced/entity-criteria";

xdescribe("prototyping-playground", () => {
    const treeNodeCreatable: Instance<TreeNode, "creatable"> = {
        name: "foo",
        parentId: 3,
    };

    const treeNodePatch: Instance<TreeNode, "patchable"> = {
        name: "foo",
    };

    class AuthorModel {
        id = createProperty("id", Number, b => b.loadable());
        name = createProperty("name", String, b => b.loadable(["optional"]));
    }

    abstract class ShapeModel {
        id = createProperty("id", Number, b => b.loadable());
        area = createProperty("area", Number, b => b.loadable(["optional"]));
        canvas = createProperty("canvas", CanvasModel, b => b.loadable(["optional"]));
    }

    class CircleModel extends ShapeModel {
        radius = createProperty("radius", Number, b => b.loadable(["optional"]));
        type = createProperty("type", "circle" as "circle", b => b.loadable());
    }

    class SquareModel extends ShapeModel {
        length = createProperty("length", Number, b => b.loadable(["optional"]));
        type = createProperty("type", "square" as "square", b => b.loadable());
    }

    class TriangleModel extends ShapeModel {
        type = createProperty("type", "triangle" as "triangle", b => b.loadable());
        angleA = createProperty("angleA", Number, b => b.loadable(["optional"]));
        angleB = createProperty("angleB", Number, b => b.loadable(["optional"]));
        angleC = createProperty("angleC", Number, b => b.loadable(["optional"]));
    }

    class CanvasModel {
        id = createProperty("id", Number, b => b.loadable());
        author = createProperty("author", AuthorModel, b => b.loadable(["optional"]));
        name = createProperty("name", String, b => b.loadable());
        shapes = createProperty("shapes", [CircleModel, SquareModel, TriangleModel], b => b.loadable(["optional"]).iterable());
    }

    it("playing w/ unions", () => {
        class CanvasQuery extends Query<CanvasModel> {
            getModel() {
                return CanvasModel;
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

        const canvasSelection: ModelSelection<CanvasModel> = {
            author: true,
            shapes: {
                canvas: true,
                angleA: true,
                area: true,
                angleB: true,
                length: true,
            },
        };

        const canvasSelector: ObjectSelector<CanvasModel> = {} as any;
        const selection = canvasSelector.author(x => x.name()).shapes(x => x.area().radius().length().canvas().angleA().angleB().angleC())[Selected];

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
        const canvasCriteria: EntityCriteria<CanvasModel> = [
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
});
