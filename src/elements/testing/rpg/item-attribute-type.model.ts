import { EntityBlueprint } from "../../entity/entity-blueprint";

const { register, id, string, number, nullable, readonly, creatable } = EntityBlueprint;

export class ItemAttributeTypeBlueprint {
    id = id();
    assignId = number({ readonly, creatable });
    name = string();
    createdAt = string({ readonly });
    updatedAt = string({ readonly, nullable });
}

export type ItemAttributeTypeCreatable = EntityBlueprint.Creatable<ItemAttributeTypeBlueprint>;
export type ItemAttributeTypeUpdatable = EntityBlueprint.Updatable<ItemAttributeTypeBlueprint>;
export type ItemAttributeTypeSavable = EntityBlueprint.Savable<ItemAttributeTypeBlueprint>;
export type ItemAttributeType = EntityBlueprint.Instance<ItemAttributeTypeBlueprint>;
register(ItemAttributeTypeBlueprint, { name: "item-attribute-type" });
