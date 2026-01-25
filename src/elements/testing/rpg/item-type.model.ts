import { EntityBlueprint } from "../../entity/entity-blueprint";

const { register, id, string, number, readonly, creatable } = EntityBlueprint;

export class ItemTypeBlueprint {
    id = id();
    assignId = number({ readonly, creatable });
    name = string();
}

register(ItemTypeBlueprint, { name: "item-type" });

export type ItemType = EntityBlueprint.Type<ItemTypeBlueprint>;
