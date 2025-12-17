import { EntityBlueprint } from "../../entity/entity-blueprint";
import { ItemAttributeBlueprint } from "./item-attribute.model";
import { ItemSocketBlueprint } from "./item-socket.model";
import { ItemTypeBlueprint } from "./item-type.model";

const { register, id, string, number, entity, array, nullable, readonly, creatable } = EntityBlueprint;

export class ItemBlueprint {
    id = id();
    assignId = number({ readonly, creatable });
    name = string();
    typeId = number();
    type = entity(ItemTypeBlueprint, this.typeId, type => type.id);
    attributes = entity(ItemAttributeBlueprint, { array });
    sockets = entity(ItemSocketBlueprint, this.id, itemSocket => itemSocket.itemId, { array });
    createdAt = string({ readonly });
    updatedAt = string({ readonly, nullable });
}

export type ItemCreatable = EntityBlueprint.Creatable<ItemBlueprint>;
export type ItemUpdatable = EntityBlueprint.Updatable<ItemBlueprint>;
export type ItemSavable = EntityBlueprint.Savable<ItemBlueprint>;
export type Item = EntityBlueprint.Instance<ItemBlueprint>;
register(ItemBlueprint, { name: "item" });
