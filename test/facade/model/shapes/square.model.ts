import { createProperty } from "src";
import { ShapeModel } from "./shape.model";

export class SquareModel extends ShapeModel {
    length = createProperty("length", Number, b => b.loadable(["optional"]));
    type = createProperty("type", "square" as "square", b => b.loadable());
}
