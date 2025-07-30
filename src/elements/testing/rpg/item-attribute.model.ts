import { EntityBlueprint } from "../../entity/entity-blueprint";
import { ItemAttributeTypeBlueprint } from "./item-attribute-type.model";

const { register, number, entity, array, optional } = EntityBlueprint;

export class ItemAttributeBlueprint {
    typeId = number();
    type = entity(ItemAttributeTypeBlueprint, this.typeId, type => type.id, { optional });
    values = number({ array });
}

register(ItemAttributeBlueprint);
