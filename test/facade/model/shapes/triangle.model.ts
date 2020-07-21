import { createProperty } from "src";
import { ShapeModel } from "./shape.model";

export class TriangleModel extends ShapeModel {
    type = createProperty("type", "triangle" as "triangle", b => b.loadable());
    angleA = createProperty("angleA", Number, b => b.loadable(["optional"]));
    angleB = createProperty("angleB", Number, b => b.loadable(["optional"]));
    angleC = createProperty("angleC", Number, b => b.loadable(["optional"]));
}
