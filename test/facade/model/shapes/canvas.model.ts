import { createProperty } from "src";
import { AuthorModel } from "./author.model";
import { CircleModel } from "./circle.model";
import { SquareModel } from "./square.model";
import { TriangleModel } from "./triangle.model";

export class CanvasModel {
    id = createProperty("id", Number, b => b.loadable());
    author = createProperty("author", AuthorModel, b => b.loadable(["optional"]));
    name = createProperty("name", String, b => b.loadable());
    shapes = createProperty("shapes", [CircleModel, SquareModel, TriangleModel], b => b.loadable(["optional"]).iterable());
}
