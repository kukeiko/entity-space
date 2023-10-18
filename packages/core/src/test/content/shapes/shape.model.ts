import { Class } from "@entity-space/utils";
import { EntityBlueprint } from "../../../lib/schema/entity-blueprint";
import { EntityBlueprintInstance } from "../../../lib/schema/entity-blueprint-instance.type";
import { define } from "../../../lib/schema/entity-blueprint-property";
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
@EntityBlueprint({ id: "canvases" })
export class CanvasBlueprint {
    id = define(Number, { id: true });
    authorId = define(Number, { optional: true, nullable: true });
    author = define(UserBlueprint, { optional: true, relation: true, from: "authorId", to: "id", nullable: true });
    name = define(String, { optional: true });
    shapes = define(ShapeBlueprints, { optional: true, array: true, nullable: true });
}

/**
 * Base class (and therefore abstract) for all other shapes.
 */
export abstract class BaseShapeBlueprint extends DataEntryBlueprint {
    id = define(Number, { id: true });
    area = define(Number, { optional: true });
    canvas = define(CanvasBlueprint, { optional: true });
}

/**
 * A circle, based on a shape, with a "type" property as a discriminator to identify it correctly as a circle.
 */
@EntityBlueprint({ id: "circles" })
export class CircleBlueprint extends BaseShapeBlueprint {
    radius = define(Number, { optional: true });
    type = define("circle" as const, { discriminator: true });
}

/**
 * A square, based on a shape, with a "type" property as a discriminator to identify it correctly as a square.
 */
@EntityBlueprint({ id: "squares" })
export class SquareBlueprint extends BaseShapeBlueprint {
    length = define(Number, { optional: true });
    type = define("square" as const, { discriminator: true });
}

/**
 * A triangle, based on a shape, with a "type" property as a discriminator to identify it correctly as a triangle.
 */
@EntityBlueprint({ id: "triangles" })
export class TriangleBlueprint extends BaseShapeBlueprint {
    type = define("triangle" as const, { discriminator: true });
    angleA = define(Number, { optional: true });
    angleB = define(Number, { optional: true });
    angleC = define(Number, { optional: true });
}

/**
 * A group of shapes, with a "type" property as a discriminator to identify it correctly as a group of shapes.
 */
@EntityBlueprint({ id: "shape-groups" })
export class ShapeGroupBlueprint extends BaseShapeBlueprint {
    type = define("group" as const, { discriminator: true });
    shapes = define(ShapeBlueprints, { optional: true, array: true });
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

export type Shape = EntityBlueprintInstance<ShapeBlueprint>;
export type Circle = EntityBlueprintInstance<CircleBlueprint>;
export type Square = EntityBlueprintInstance<SquareBlueprint>;
export type Triangle = EntityBlueprintInstance<TriangleBlueprint>;
export type Canvas = EntityBlueprintInstance<CanvasBlueprint>;
