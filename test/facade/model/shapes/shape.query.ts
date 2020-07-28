import { TypedQuery, TypedSelection } from "src";
import { Shape, allShapeModels } from "./shape.model";

export class ShapeQuery<S extends TypedSelection<Shape> = TypedSelection<Shape>> extends TypedQuery<Shape, S> {
    getModel() {
        return allShapeModels;
    }

    model = allShapeModels;
}
