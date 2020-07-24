import { Selection, Query } from "src";
import { Shape, allShapeModels } from "./shape.model";

export class ShapeQuery<S extends Selection<Shape> = Selection<Shape>> extends Query<Shape, S> {
    getModel() {
        return allShapeModels;
    }
}
