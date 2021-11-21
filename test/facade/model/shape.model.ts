import { define, Class } from "src";
import { DataEntryModel } from "./data-entry.model";
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
export class CanvasModel  {
    id = define(Number, { id: true, required: true });
    authorId = define(Number);
    author = define(AuthorModel);
    name = define(String);
    shapes = define(allShapeModels, { array: true });
}

/**
 * Base class (and therefore abstract) for all other shapes.
 */
export abstract class ShapeModel extends DataEntryModel {
    id = define(Number, { id: true, required: true });
    area = define(Number);
    canvas = define(CanvasModel);
}

/**
 * A circle, based on a shape, with a "type" property as a discriminator to identify it correctly as a circle.
 */
export class CircleModel extends ShapeModel {
    radius = define(Number);
    type = define("circle" as const, { discriminator: true, required: true });
}

/**
 * A square, based on a shape, with a "type" property as a discriminator to identify it correctly as a square.
 */
export class SquareModel extends ShapeModel {
    length = define(Number);
    type = define("square" as const, { discriminator: true, required: true });
}

/**
 * A triangle, based on a shape, with a "type" property as a discriminator to identify it correctly as a triangle.
 */
export class TriangleModel extends ShapeModel {
    type = define("triangle" as const, { discriminator: true, required: true });
    angleA = define(Number);
    angleB = define(Number);
    angleC = define(Number);
}

/**
 * A group of shapes, with a "type" property as a discriminator to identify it correctly as a group of shapes.
 */
export class ShapeGroupModel extends ShapeModel {
    type = define("group" as const, { discriminator: true, required: true });
    shapes = define(allShapeModels, { array: true });
}

/**
 * Helper type to easily refer to all shapes.
 */
export type Shape = CircleModel | SquareModel | TriangleModel | ShapeGroupModel;

/**
 * Helper var to easily reference to all shapes.
 */
export const allShapeModels: Class<Shape>[] = [CircleModel, SquareModel, TriangleModel, ShapeGroupModel];
