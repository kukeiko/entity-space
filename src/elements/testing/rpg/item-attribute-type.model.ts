import { EntityBlueprint } from "../../entity/entity-blueprint";

const { register, id, string, number, nullable, readonly, creatable } = EntityBlueprint;

export class ItemAttributeTypeBlueprint {
    id = id();
    assignId = number({ readonly, creatable });
    name = string();
    createdAt = string({ readonly });
    updatedAt = string({ readonly, nullable });
}

register(ItemAttributeTypeBlueprint, { name: "item-attribute-type" });

export type ItemAttributeType = EntityBlueprint.Type<ItemAttributeTypeBlueprint>;
