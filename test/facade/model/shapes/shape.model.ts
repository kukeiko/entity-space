import { createProperty } from "src";
import { CanvasModel } from "./canvas.model";

export abstract class ShapeModel {
    id = createProperty("id", Number, b => b.loadable());
    area = createProperty("area", Number, b => b.loadable(["optional"]));
    canvas = createProperty("canvas", CanvasModel, b => b.loadable(["optional"]));
}
