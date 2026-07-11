import { EntityBlueprint } from "../../entity/blueprint/entity-blueprint";

const { register, id, number, discriminator } = EntityBlueprint;

export class CircleBlueprint {
    id = id();
    type = discriminator("circle");
    radius = number();
}

register(CircleBlueprint);
export type Circle = EntityBlueprint.Type<CircleBlueprint>;
