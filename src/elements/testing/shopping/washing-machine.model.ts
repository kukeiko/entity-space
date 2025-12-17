import { EntityBlueprint } from "../../entity/entity-blueprint";
import { ProductBlueprint } from "./product.model";

const { register, id, number, entity, creatable, parent } = EntityBlueprint;

export class WashingMachineBlueprint {
    id = id({ creatable });
    product = entity(ProductBlueprint, this.id, product => product.id, { parent });
    maxLoadKg = number();
}

register(WashingMachineBlueprint, { name: "washing-machine" });

export type WashingMachine = EntityBlueprint.Instance<WashingMachineBlueprint>;
