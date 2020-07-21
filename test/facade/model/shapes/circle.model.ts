import { createProperty } from "src";
import { ShapeModel } from "./shape.model";

export class CircleModel extends ShapeModel {
    radius = createProperty("radius", Number, b => b.loadable(["optional"]));
    type = createProperty("type", "circle" as "circle", b => b.loadable());
}
