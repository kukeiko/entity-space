import { Query } from "../query";
import { Property } from "./property";
import { Instance } from "./instance";
import { ObjectSelector, Selected } from "./selector";

xdescribe("advanced playground", () => {
    class AuthorModel {
        id = Property.create("id", Number, b => b.loadable());
        name = Property.create("name", String, b => b.loadable(["optional"]));
    }

    class CircleModel {
        area = Property.create("area", Number, b => b.loadable(["optional"]));
        radius = Property.create("radius", Number, b => b.loadable(["optional"]));
        type = Property.create("type", "circle" as "circle", b => b.loadable());
    }

    class SquareModel {
        area = Property.create("area", Number, b => b.loadable(["optional"]));
        length = Property.create("length", Number, b => b.loadable(["optional"]));
        type = Property.create("type", "square" as "square", b => b.loadable());
    }

    class CanvasModel {
        author = Property.create("author", AuthorModel, b => b.loadable(["optional"]));
        name = Property.create("name", String, b => b.loadable());
        shapes = Property.create("shapes", [CircleModel, SquareModel], b => b.loadable(["optional"]).iterable());
    }

    class CanvasQuery extends Query<CanvasModel> {
        getModel() {
            return CanvasModel;
        }
    }

    type CanvasQueryDefaultPayload = Query.Payload<CanvasQuery>;

    const x: CanvasQueryDefaultPayload = [
        {
            name: "foo",
        },
    ];

    /**
     * - need selection
     */
    const foo = {
        author: {
            name: true,
        },
        shapes: true,
    };

    xit("foo", () => {
        // const canvasInstance: Instance.Selected<CanvasModel, ModelSelection<CanvasModel>> = {
        const canvasInstance: Instance.Selected<CanvasModel, typeof foo> = {
            name: "foo",
            author: {
                id: 3,
                name: "foo",
            },
            shapes: [
                { type: "square", area: 3, length: 2 },
                { type: "circle", area: 9, radius: 123 },
            ],
        };

        const canvasSelector: ObjectSelector<CanvasModel> = {} as any;
        const selection = canvasSelector.author(x => x.name()).shapes(x => x.area())[Selected];

        const selectedInstance: Instance.Selected<CanvasModel, typeof selection> = {
            author: {
                id: 3,
                name: "susi",
            },
            name: "malwand",
            shapes: [
                { type: "square", area: 3, length: 2 },
                { type: "circle", area: 9, radius: 123 },
            ],
        };
    });
});
