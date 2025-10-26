import { EntityBlueprint } from "../../entity/entity-blueprint";

const { register, id, string, number, readonly, creatable } = EntityBlueprint;

export class ItemTypeBlueprint {
    id = id();
    assignId = number({ readonly, creatable });
    name = string();
}

export type ItemTypeCreatable = EntityBlueprint.Creatable<ItemTypeBlueprint>;
export type ItemTypeUpdatable = EntityBlueprint.Updatable<ItemTypeBlueprint>;
export type ItemTypeSavable = EntityBlueprint.Savable<ItemTypeBlueprint>;
export type ItemType = EntityBlueprint.Instance<ItemTypeBlueprint>;
register(ItemTypeBlueprint, { name: "item-type" });
