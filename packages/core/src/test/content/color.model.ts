import { EntityBlueprint } from "../../lib/schema/entity-blueprint";
import { EntityBlueprintInstance } from "../../lib/schema/entity-blueprint-instance.type";
import { define } from "../../lib/schema/entity-blueprint-property";

@EntityBlueprint({ id: "colors" })
export class ColorBlueprint {
    id = define(Number, { id: true });
    name = define(String);
}

export type Color = EntityBlueprintInstance<ColorBlueprint>;
