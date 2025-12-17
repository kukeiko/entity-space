import { EntityBlueprint } from "../../entity/entity-blueprint";
import { ItemBlueprint } from "./item.model";

const { register, id, string, number, entity, nullable, readonly, creatable } = EntityBlueprint;

export class ItemSocketBlueprint {
    id = id();
    assignId = number({ readonly, creatable });
    itemId = number();
    item = entity(ItemBlueprint, this.itemId, item => item.id);
    socketedItemId = number();
    socketedItem = entity(ItemBlueprint, this.socketedItemId, item => item.id);
    createdAt = string({ readonly });
    updatedAt = string({ readonly, nullable });
}

export type ItemSocketCreatable = EntityBlueprint.Creatable<ItemSocketBlueprint>;
export type ItemSocketUpdatable = EntityBlueprint.Updatable<ItemSocketBlueprint>;
export type ItemSocketSavable = EntityBlueprint.Savable<ItemSocketBlueprint>;
export type ItemSocket = EntityBlueprint.Instance<ItemSocketBlueprint>;
register(ItemSocketBlueprint);
