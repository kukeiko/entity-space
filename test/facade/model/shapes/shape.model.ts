import { createProperty, Class } from "src";
import { DataEntryModel } from "../data-entry.model";
import { AuthorModel } from "./author.model";

/**
 * This file contains models to showcase how you can deal with inheritance. We're using the idea of
 * having a canvas which contains shapes it has drawn onto it: circles, squares, triangles, and groups of shapes.
 *
 * A group of shapes in turn has, like the canvas, an array of shapes.
 *
 * All shapes are based on a common shape base model. When a canvas is loaded, the "type" property is used
 * to identify which shape we're dealing with - so when you use a conditional expresson on the type property
 * of a shape, you can access its unique values (e.g. if shape.type equals "circle", you can access shape.radius).
 *
 * [note] we have to put them all into one file due to circular references
 */

/**
 * A model that points to an array of unioned models: circles, squares, triangles and grouped shapes.
 */
export class CanvasModel extends DataEntryModel {
    id = createProperty("id", [Number], b => b.loadable().identifier());
    authorId = createProperty("authorId", [Number], b => b.loadable());
    author = createProperty("author", [AuthorModel], b => b.loadable(["optional"]).identifiedBy(this.authorId));
    name = createProperty("name", [String], b => b.loadable());
    shapes = createProperty("shapes", allShapeModels, b => b.loadable(["optional"]).iterable());
}

/**
 * Base class (and therefore abstract) for all other shapes.
 */
export abstract class ShapeModel extends DataEntryModel {
    id = createProperty("id", [Number], b => b.loadable().identifier());
    area = createProperty("area", [Number], b => b.loadable(["optional"]));
    canvas = createProperty("canvas", [CanvasModel], b => b.loadable(["optional"]));
}

/**
 * A circle, based on a shape, with a "type" property as a discriminator to identify it correctly as a circle.
 */
export class CircleModel extends ShapeModel {
    radius = createProperty("radius", [Number], b => b.loadable(["optional"]));
    type = createProperty("type", ["circle" as const], b => b.loadable().discriminant());
}

/**
 * A square, based on a shape, with a "type" property as a discriminator to identify it correctly as a square.
 */
export class SquareModel extends ShapeModel {
    length = createProperty("length", [Number], b => b.loadable(["optional"]));
    type = createProperty("type", ["square" as const], b => b.loadable().discriminant());
}

/**
 * A triangle, based on a shape, with a "type" property as a discriminator to identify it correctly as a triangle.
 */
export class TriangleModel extends ShapeModel {
    type = createProperty("type", ["triangle" as const], b => b.loadable().discriminant());
    angleA = createProperty("angleA", [Number], b => b.loadable(["optional"]));
    angleB = createProperty("angleB", [Number], b => b.loadable(["optional"]));
    angleC = createProperty("angleC", [Number], b => b.loadable(["optional"]));
}

/**
 * A group of shapes, with a "type" property as a discriminator to identify it correctly as a group of shapes.
 */
export class ShapeGroupModel extends ShapeModel {
    type = createProperty("type", ["group" as const], b => b.loadable().discriminant());
    shapes = createProperty("shapes", allShapeModels, b => b.loadable(["optional"]).iterable());
}

/**
 * Helper type to easily refer to all shapes.
 */
export type Shape = CircleModel | SquareModel | TriangleModel | ShapeGroupModel;

/**
 * Helper var to easily reference to all shapes.
 */
export const allShapeModels: Class<Shape>[] = [CircleModel, SquareModel, TriangleModel, ShapeGroupModel];
