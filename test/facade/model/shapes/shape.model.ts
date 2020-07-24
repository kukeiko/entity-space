import { createProperty } from "src";
import { DataEntryModel } from "../data-entry.model";
import { AuthorModel } from "./author.model";

/**
 * [note] we have to put them all into one file due to circular references
 */

export class CanvasModel extends DataEntryModel {
    id = createProperty("id", Number, b => b.loadable());
    author = createProperty("author", AuthorModel, b => b.loadable(["optional"]));
    name = createProperty("name", String, b => b.loadable());
    shapes = createProperty("shapes", allShapeModels, b => b.loadable(["optional"]).iterable());
}

export abstract class ShapeModel extends DataEntryModel {
    id = createProperty("id", Number, b => b.loadable());
    area = createProperty("area", Number, b => b.loadable(["optional"]));
    canvas = createProperty("canvas", CanvasModel, b => b.loadable(["optional"]));
}

export class CircleModel extends ShapeModel {
    radius = createProperty("radius", Number, b => b.loadable(["optional"]));
    type = createProperty("type", "circle" as "circle", b => b.loadable());
}

export class SquareModel extends ShapeModel {
    length = createProperty("length", Number, b => b.loadable(["optional"]));
    type = createProperty("type", "square" as "square", b => b.loadable());
}

export class TriangleModel extends ShapeModel {
    type = createProperty("type", "triangle" as "triangle", b => b.loadable());
    angleA = createProperty("angleA", Number, b => b.loadable(["optional"]));
    angleB = createProperty("angleB", Number, b => b.loadable(["optional"]));
    angleC = createProperty("angleC", Number, b => b.loadable(["optional"]));
}

export const allShapeModels = [CircleModel, SquareModel, TriangleModel];
export type Shape = CircleModel | SquareModel | TriangleModel;
