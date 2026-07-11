import { EntityBlueprint } from "../../entity/blueprint/entity-blueprint";

const { register, id, number, string, boolean, entity, discriminator, array } = EntityBlueprint;

export class SceneBlueprint {
    id = id();
    name = string();
    gameObjects = entity(GameObjectBlueprint, this.id, other => other.sceneId, { array });
}

export type Scene = EntityBlueprint.Type<SceneBlueprint>;
register(SceneBlueprint);

export abstract class GameObjectBaseBlueprint {
    id = id();
    name = string();
    sceneId = number();
    scene = entity(SceneBlueprint, this.sceneId, other => other.id);
}

export class CharacterBlueprint extends GameObjectBaseBlueprint {
    type = discriminator("character");
    equipment = entity(EquipmentBlueprint, this.id, other => other.characterId, { array });
    factionId = number();
    faction = entity(FactionBlueprint, this.factionId, other => other.id);
}

export type Character = EntityBlueprint.Type<CharacterBlueprint>;
register(CharacterBlueprint);

export abstract class EquipmentBlueprintBase extends GameObjectBaseBlueprint {
    characterId = number();
    character = entity(CharacterBlueprint, this.characterId, other => other.id);
}

export class AxeBlueprint extends EquipmentBlueprintBase {
    type = discriminator("axe");
}

register(AxeBlueprint);

export class PickaxeBlueprint extends EquipmentBlueprintBase {
    type = discriminator("pickaxe");
}

register(PickaxeBlueprint);

export const EquipmentBlueprint = [AxeBlueprint, PickaxeBlueprint];
export type Equipment = EntityBlueprint.Type<typeof EquipmentBlueprint>;
register(EquipmentBlueprint);

export class FactionBlueprint extends GameObjectBaseBlueprint {
    type = discriminator("faction");
}

export type Faction = EntityBlueprint.Type<FactionBlueprint>;
register(FactionBlueprint);

export abstract class ResourceBlueprintBase extends GameObjectBaseBlueprint {
    biomeId = number();
    biome = entity(BiomeBlueprint, this.biomeId, other => other.id);
}

export class PlantBlueprint extends ResourceBlueprintBase {
    type = discriminator("plant");
    hasFruits = boolean();
}

register(PlantBlueprint);

export class OreBlueprint extends ResourceBlueprintBase {
    type = discriminator("ore");
    isRadioactive = boolean();
}

register(OreBlueprint);

export const ResourceBlueprint = [PlantBlueprint, OreBlueprint];
export type ResourceBlueprint = typeof ResourceBlueprint;
export type Resource = EntityBlueprint.Type<typeof ResourceBlueprint>;
register(ResourceBlueprint);

export class BiomeBlueprint extends GameObjectBaseBlueprint {
    type = discriminator("biome");
    resources = entity(ResourceBlueprint, this.id, other => other.biomeId, { array });
}

register(BiomeBlueprint);

export const GameObjectBlueprint = [
    CharacterBlueprint,
    ...EquipmentBlueprint,
    BiomeBlueprint,
    ...ResourceBlueprint,
    FactionBlueprint,
];
export type GameObjectBlueprint = typeof GameObjectBlueprint;
export type GameObject = EntityBlueprint.Type<typeof GameObjectBlueprint>;

register(GameObjectBlueprint, { name: "game-objects" });
