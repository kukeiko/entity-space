import { EntityBlueprint } from "../../entity/blueprint/entity-blueprint";

const { register, id, number, discriminator } = EntityBlueprint;

export class SquareBlueprint {
    id = id();
    type = discriminator("square");
    length = number();
}

register(SquareBlueprint);
export type Square = EntityBlueprint.Type<SquareBlueprint>;
