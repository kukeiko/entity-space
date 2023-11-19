import { EntityBlueprint } from "../../lib/schema/entity-blueprint";
import { EntityBlueprintInstance } from "../../lib/schema/entity-blueprint-instance.type";
import { define } from "../../lib/schema/entity-blueprint-property";

// @EntityBlueprint({ id: "minecraft-block-positions", key: ["x", "y", "z"] })
@EntityBlueprint({ id: "minecraft-block-positions" })
export class MinecraftBlockPositionBlueprint {
    x = define(Number);
    y = define(Number);
    z = define(Number);
}

export type MinecraftBlockPosition = EntityBlueprintInstance<MinecraftBlockPositionBlueprint>;

@EntityBlueprint({
    id: "minecraft-blocks",
    key: ["position.x", "position.y", "position.z"],
    indexes: { xz: ["position.x", "position.z"] },
})
export class MinecraftBlockBlueprint {
    // [todo] we don't support objects as ids yet in blueprints
    position = define(MinecraftBlockPositionBlueprint);
    typeId = define(String, { index: true });
}

export type MinecraftBlock = EntityBlueprintInstance<MinecraftBlockBlueprint>;
