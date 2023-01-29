import { Class } from "@entity-space/utils";
import { Blueprint } from "../../../lib/schema/blueprint";
import { BlueprintInstance } from "../../../lib/schema/blueprint-instance";
import { define } from "../../../lib/schema/blueprint-property";
import { DataEntryBlueprint } from "../common/data-entry.model";
import { UserBlueprint } from "../common/user.model";

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
@Blueprint({ id: "canvases" })
export class CanvasBlueprint {
    id = define(Number, { id: true, required: true });
    authorId = define(Number, { nullable: true });
    author = define(UserBlueprint, { relation: true, from: "authorId", to: "id", nullable: true });
    name = define(String);
    shapes = define(ShapeBlueprints, { array: true, nullable: true });
}

/**
 * Base class (and therefore abstract) for all other shapes.
 */
export abstract class BaseShapeBlueprint extends DataEntryBlueprint {
    id = define(Number, { id: true, required: true });
    area = define(Number);
    canvas = define(CanvasBlueprint);
}

/**
 * A circle, based on a shape, with a "type" property as a discriminator to identify it correctly as a circle.
 */
@Blueprint({ id: "circles" })
export class CircleBlueprint extends BaseShapeBlueprint {
    radius = define(Number);
    type = define("circle" as const, { discriminator: true, required: true });
}

/**
 * A square, based on a shape, with a "type" property as a discriminator to identify it correctly as a square.
 */
@Blueprint({ id: "squares" })
export class SquareBlueprint extends BaseShapeBlueprint {
    length = define(Number);
    type = define("square" as const, { discriminator: true, required: true });
}

/**
 * A triangle, based on a shape, with a "type" property as a discriminator to identify it correctly as a triangle.
 */
@Blueprint({ id: "triangles" })
export class TriangleBlueprint extends BaseShapeBlueprint {
    type = define("triangle" as const, { discriminator: true, required: true });
    angleA = define(Number);
    angleB = define(Number);
    angleC = define(Number);
}

/**
 * A group of shapes, with a "type" property as a discriminator to identify it correctly as a group of shapes.
 */
@Blueprint({ id: "shape-groups" })
export class ShapeGroupBlueprint extends BaseShapeBlueprint {
    type = define("group" as const, { discriminator: true, required: true });
    shapes = define(ShapeBlueprints, { array: true });
}

/**
 * Helper type to easily refer to all shapes.
 */
export type ShapeBlueprint = CircleBlueprint | SquareBlueprint | TriangleBlueprint | ShapeGroupBlueprint;

/**
 * Helper var to easily reference to all shapes.
 */
export const ShapeBlueprints: Class<ShapeBlueprint>[] = [
    CircleBlueprint,
    SquareBlueprint,
    TriangleBlueprint,
    ShapeGroupBlueprint,
];

export type Shape = BlueprintInstance<ShapeBlueprint>;
export type Circle = BlueprintInstance<CircleBlueprint>;
export type Square = BlueprintInstance<SquareBlueprint>;
export type Triangle = BlueprintInstance<TriangleBlueprint>;
export type Canvas = BlueprintInstance<CanvasBlueprint>;
