import { PackedEntitySelection } from "src/common";
import { EntityBlueprint } from "../../entity/blueprint/entity-blueprint";
import { CircleBlueprint } from "./circle.model";
import { SquareBlueprint } from "./square.model";

const { register } = EntityBlueprint;

export const ShapeBlueprint = [CircleBlueprint, SquareBlueprint];
register(ShapeBlueprint, { name: "shapes" });
export type Shape = EntityBlueprint.Type<typeof ShapeBlueprint>;

const square: EntityBlueprint.Type<SquareBlueprint> = {
    id: 1,
    type: "square",
    length: 3,
};

const circle: EntityBlueprint.Type<CircleBlueprint> = {
    id: 2,
    type: "circle",
    radius: 9,
};

const shape: EntityBlueprint.Type<typeof ShapeBlueprint> = {
    id: 2,
    type: "square",
    length: 9,
};

const shapeSelection: PackedEntitySelection<Shape> = {
    length: true,
    type: true,
    radius: true,
};
