import { Instance } from "src/advanced/instance";
import { TreeNode } from "../facade";
import { ObjectSelector, Selected } from "../../src/advanced/selector";
import { Property } from "../../src/advanced/property";
import { Query, MergeUnion } from "../../src";
import { ModelSelection } from "../../src/advanced/selection";

describe("prototyping-playground", () => {
    const treeNodeCreatable: Instance<TreeNode, "creatable"> = {
        name: "foo",
        parentId: 3,
    };

    const treeNodePatch: Instance<TreeNode, "patchable"> = {
        name: "foo",
    };

    it("playing w/ unions", () => {
        const idProperty = Property.create("id", Number, b => b.loadable());

        class AuthorModel {
            id = idProperty;
            name = Property.create("name", String, b => b.loadable(["optional"]));
        }

        class CircleModel {
            id = idProperty;
            canvas = Property.create("canvas", CanvasModel, b => b.loadable(["optional"]));
            area = Property.create("area", Number, b => b.loadable(["optional"]));
            radius = Property.create("radius", Number, b => b.loadable(["optional"]));
            type = Property.create("type", "circle" as "circle", b => b.loadable());
        }

        class SquareModel {
            id = idProperty;
            canvas = Property.create("canvas", CanvasModel, b => b.loadable(["optional"]));
            area = Property.create("area", Number, b => b.loadable(["optional"]));
            length = Property.create("length", Number, b => b.loadable(["optional"]));
            type = Property.create("type", "square" as "square", b => b.loadable());
        }

        class TriangleModel {
            id = idProperty;
            canvas = Property.create("canvas", CanvasModel, b => b.loadable(["optional"]));
            area = Property.create("area", Number, b => b.loadable(["optional"]));
            type = Property.create("type", "triangle" as "triangle", b => b.loadable());
            a = Property.create("a", Number, b => b.loadable(["optional"]));
            b = Property.create("c", Number, b => b.loadable(["optional"]));
            c = Property.create("b", Number, b => b.loadable(["optional"]));
        }

        class CanvasModel {
            id = idProperty;
            author = Property.create("author", AuthorModel, b => b.loadable(["optional"]));
            name = Property.create("name", String, b => b.loadable());
            shapes = Property.create("shapes", [CircleModel, SquareModel, TriangleModel], b => b.loadable(["optional"]).iterable());
        }

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
            },
        ];

        const canvasSelection: ModelSelection<CanvasModel> = {
            author: true,
            shapes: {
                canvas: true,
                a: true,
                area: true,
                b: true,
                length: true,
            },
        };

        const canvasSelector: ObjectSelector<CanvasModel> = {} as any;
        const selection = canvasSelector.author(x => x.name()).shapes(x => x.area().radius().length().canvas().a().b().c())[Selected];

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
                { id: 21, type: "triangle", area: 13, a: 1, b: 2, c: 3, canvas: { id: 7, name: "malwand" } },
            ],
        };
    });
});
